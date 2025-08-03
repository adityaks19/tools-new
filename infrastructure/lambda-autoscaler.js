const AWS = require('aws-sdk');

const ecs = new AWS.ECS();
const cloudwatch = new AWS.CloudWatch();
const applicationAutoScaling = new AWS.ApplicationAutoScaling();

/**
 * Intelligent Auto-Scaler Lambda Function
 * Scales ECS service to zero when no traffic, scales up on demand
 */
exports.handler = async (event) => {
    console.log('🔄 Auto-scaler triggered:', JSON.stringify(event, null, 2));
    
    const clusterName = process.env.ECS_CLUSTER_NAME;
    const serviceName = process.env.ECS_SERVICE_NAME;
    const targetGroupArn = process.env.TARGET_GROUP_ARN;
    const minCapacity = parseInt(process.env.MIN_CAPACITY) || 0;
    const maxCapacity = parseInt(process.env.MAX_CAPACITY) || 10;
    
    try {
        // Get current service status
        const serviceInfo = await getCurrentServiceInfo(clusterName, serviceName);
        const currentDesiredCount = serviceInfo.desiredCount;
        const currentRunningCount = serviceInfo.runningCount;
        
        console.log(`📊 Current service status: Desired=${currentDesiredCount}, Running=${currentRunningCount}`);
        
        // Get traffic metrics from the last 15 minutes
        const trafficMetrics = await getTrafficMetrics(targetGroupArn);
        const cpuMetrics = await getCPUMetrics(clusterName, serviceName);
        
        console.log('📈 Traffic metrics:', trafficMetrics);
        console.log('🖥️ CPU metrics:', cpuMetrics);
        
        // Determine scaling action
        const scalingDecision = determineScalingAction(
            trafficMetrics,
            cpuMetrics,
            currentDesiredCount,
            minCapacity,
            maxCapacity
        );
        
        console.log('🎯 Scaling decision:', scalingDecision);
        
        // Execute scaling action if needed
        if (scalingDecision.action !== 'no_change') {
            await executeScalingAction(clusterName, serviceName, scalingDecision);
            
            // Log cost savings
            if (scalingDecision.action === 'scale_to_zero') {
                const costSavings = calculateCostSavings(currentDesiredCount);
                console.log(`💰 Estimated cost savings: $${costSavings.hourly}/hour, $${costSavings.daily}/day`);
            }
        }
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                action: scalingDecision.action,
                previousCount: currentDesiredCount,
                newCount: scalingDecision.targetCount,
                reason: scalingDecision.reason,
                timestamp: new Date().toISOString()
            })
        };
        
    } catch (error) {
        console.error('❌ Auto-scaler error:', error);
        
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            })
        };
    }
};

/**
 * Get current ECS service information
 */
async function getCurrentServiceInfo(clusterName, serviceName) {
    const params = {
        cluster: clusterName,
        services: [serviceName]
    };
    
    const result = await ecs.describeServices(params).promise();
    const service = result.services[0];
    
    if (!service) {
        throw new Error(`Service ${serviceName} not found in cluster ${clusterName}`);
    }
    
    return {
        desiredCount: service.desiredCount,
        runningCount: service.runningCount,
        pendingCount: service.pendingCount,
        status: service.status
    };
}

/**
 * Get traffic metrics from Application Load Balancer
 */
async function getTrafficMetrics(targetGroupArn) {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 15 * 60 * 1000); // 15 minutes ago
    
    const params = {
        MetricName: 'RequestCount',
        Namespace: 'AWS/ApplicationELB',
        StartTime: startTime,
        EndTime: endTime,
        Period: 300, // 5 minutes
        Statistics: ['Sum'],
        Dimensions: [
            {
                Name: 'TargetGroup',
                Value: targetGroupArn.split('/').slice(-2).join('/')
            }
        ]
    };
    
    try {
        const result = await cloudwatch.getMetricStatistics(params).promise();
        const datapoints = result.Datapoints || [];
        
        const totalRequests = datapoints.reduce((sum, point) => sum + point.Sum, 0);
        const avgRequestsPerMinute = datapoints.length > 0 ? totalRequests / (datapoints.length * 5) : 0;
        
        return {
            totalRequests,
            avgRequestsPerMinute,
            hasTraffic: totalRequests > 0,
            datapoints: datapoints.length
        };
    } catch (error) {
        console.warn('⚠️ Could not get traffic metrics:', error.message);
        return {
            totalRequests: 0,
            avgRequestsPerMinute: 0,
            hasTraffic: false,
            datapoints: 0
        };
    }
}

/**
 * Get CPU utilization metrics
 */
async function getCPUMetrics(clusterName, serviceName) {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 10 * 60 * 1000); // 10 minutes ago
    
    const params = {
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/ECS',
        StartTime: startTime,
        EndTime: endTime,
        Period: 300, // 5 minutes
        Statistics: ['Average'],
        Dimensions: [
            {
                Name: 'ServiceName',
                Value: serviceName
            },
            {
                Name: 'ClusterName',
                Value: clusterName
            }
        ]
    };
    
    try {
        const result = await cloudwatch.getMetricStatistics(params).promise();
        const datapoints = result.Datapoints || [];
        
        const avgCPU = datapoints.length > 0 
            ? datapoints.reduce((sum, point) => sum + point.Average, 0) / datapoints.length 
            : 0;
        
        return {
            avgCPU,
            datapoints: datapoints.length,
            isHighCPU: avgCPU > 70,
            isLowCPU: avgCPU < 10
        };
    } catch (error) {
        console.warn('⚠️ Could not get CPU metrics:', error.message);
        return {
            avgCPU: 0,
            datapoints: 0,
            isHighCPU: false,
            isLowCPU: true
        };
    }
}

/**
 * Determine what scaling action to take
 */
function determineScalingAction(trafficMetrics, cpuMetrics, currentCount, minCapacity, maxCapacity) {
    // Scale to zero conditions
    if (currentCount > 0 && minCapacity === 0) {
        if (!trafficMetrics.hasTraffic && cpuMetrics.isLowCPU && cpuMetrics.datapoints > 0) {
            return {
                action: 'scale_to_zero',
                targetCount: 0,
                reason: 'No traffic detected and low CPU utilization'
            };
        }
    }
    
    // Scale up from zero conditions
    if (currentCount === 0 && trafficMetrics.hasTraffic) {
        return {
            action: 'scale_from_zero',
            targetCount: Math.max(1, minCapacity),
            reason: 'Traffic detected, scaling up from zero'
        };
    }
    
    // Scale up conditions
    if (currentCount > 0 && currentCount < maxCapacity) {
        if (trafficMetrics.avgRequestsPerMinute > 10 || cpuMetrics.isHighCPU) {
            const newCount = Math.min(maxCapacity, currentCount + 1);
            return {
                action: 'scale_up',
                targetCount: newCount,
                reason: `High load detected: ${trafficMetrics.avgRequestsPerMinute.toFixed(2)} req/min, ${cpuMetrics.avgCPU.toFixed(1)}% CPU`
            };
        }
    }
    
    // Scale down conditions (but not to zero if minCapacity > 0)
    if (currentCount > Math.max(1, minCapacity)) {
        if (trafficMetrics.avgRequestsPerMinute < 2 && cpuMetrics.isLowCPU) {
            const newCount = Math.max(Math.max(1, minCapacity), currentCount - 1);
            return {
                action: 'scale_down',
                targetCount: newCount,
                reason: `Low load detected: ${trafficMetrics.avgRequestsPerMinute.toFixed(2)} req/min, ${cpuMetrics.avgCPU.toFixed(1)}% CPU`
            };
        }
    }
    
    return {
        action: 'no_change',
        targetCount: currentCount,
        reason: 'Current capacity is appropriate for the load'
    };
}

/**
 * Execute the scaling action
 */
async function executeScalingAction(clusterName, serviceName, scalingDecision) {
    const params = {
        cluster: clusterName,
        service: serviceName,
        desiredCount: scalingDecision.targetCount
    };
    
    console.log(`🔄 Executing scaling action: ${scalingDecision.action} to ${scalingDecision.targetCount} tasks`);
    
    try {
        const result = await ecs.updateService(params).promise();
        console.log('✅ Scaling action completed successfully');
        
        // Send notification if scaling to/from zero
        if (scalingDecision.action === 'scale_to_zero' || scalingDecision.action === 'scale_from_zero') {
            await sendScalingNotification(scalingDecision);
        }
        
        return result;
    } catch (error) {
        console.error('❌ Failed to execute scaling action:', error);
        throw error;
    }
}

/**
 * Calculate cost savings from scaling to zero
 */
function calculateCostSavings(previousCount) {
    // Fargate pricing (approximate for us-east-1)
    const costPerTaskPerHour = 0.04048; // 0.25 vCPU + 0.5 GB memory
    
    const hourlySavings = (previousCount * costPerTaskPerHour).toFixed(4);
    const dailySavings = (hourlySavings * 24).toFixed(2);
    
    return {
        hourly: hourlySavings,
        daily: dailySavings,
        monthly: (dailySavings * 30).toFixed(2)
    };
}

/**
 * Send scaling notification (optional)
 */
async function sendScalingNotification(scalingDecision) {
    // You can implement SNS notifications here
    console.log(`📧 Scaling notification: ${scalingDecision.action} - ${scalingDecision.reason}`);
    
    // Example SNS notification (uncomment if you want to use it)
    /*
    const sns = new AWS.SNS();
    const message = {
        Subject: `ECS Auto-Scaling: ${scalingDecision.action}`,
        Message: `
Service scaled ${scalingDecision.action} to ${scalingDecision.targetCount} tasks.
Reason: ${scalingDecision.reason}
Timestamp: ${new Date().toISOString()}
        `,
        TopicArn: process.env.SNS_TOPIC_ARN
    };
    
    if (process.env.SNS_TOPIC_ARN) {
        await sns.publish(message).promise();
    }
    */
}

/**
 * Health check function for the Lambda
 */
exports.healthCheck = async (event) => {
    return {
        statusCode: 200,
        body: JSON.stringify({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        })
    };
};
