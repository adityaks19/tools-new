const express = require('express');
const { BedrockService, S3Service, DynamoDBService } = require('../config/aws');
const { checkSubscription } = require('../middleware/auth');

const router = express.Router();

// Process file with NLP
router.post('/process/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { customPrompt } = req.body;
    
    // Get file details
    const file = await DynamoDBService.getItem('seo-nlp-files', { fileId });
    
    if (!file || file.userId !== req.user.userId) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (file.status === 'processing') {
      return res.status(409).json({ error: 'File is already being processed' });
    }

    // Update status to processing
    await DynamoDBService.updateItem(
      'seo-nlp-files',
      { fileId },
      'SET #status = :status, updatedAt = :updatedAt',
      {
        ':status': 'processing',
        ':updatedAt': new Date().toISOString(),
        '#status': 'status'
      }
    );

    // Use custom prompt if provided, otherwise use the original prompt
    const promptToUse = customPrompt || file.prompt;
    
    try {
      // Process content with Bedrock
      const processedContent = await BedrockService.processFileContent(
        file.textContent,
        promptToUse,
        file.mimeType
      );

      // Generate SEO metadata
      const seoMetadata = await generateSEOMetadata(processedContent, file.originalName);

      // Store processed content in S3
      const processedKey = `files/${req.user.userId}/${fileId}/processed_${file.originalName}.html`;
      const htmlContent = formatAsHTML(processedContent, seoMetadata);
      
      await S3Service.uploadFile(processedKey, htmlContent, 'text/html');

      // Update file record with processed content
      await DynamoDBService.updateItem(
        'seo-nlp-files',
        { fileId },
        'SET processedContent = :content, processedS3Key = :s3Key, seoMetadata = :seo, #status = :status, updatedAt = :updatedAt',
        {
          ':content': processedContent,
          ':s3Key': processedKey,
          ':seo': seoMetadata,
          ':status': 'completed',
          ':updatedAt': new Date().toISOString(),
          '#status': 'status'
        }
      );

      res.json({
        message: 'File processed successfully',
        fileId,
        processedContent,
        seoMetadata,
        downloadUrl: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${processedKey}`
      });

    } catch (processingError) {
      // Update status to failed
      await DynamoDBService.updateItem(
        'seo-nlp-files',
        { fileId },
        'SET #status = :status, errorMessage = :error, updatedAt = :updatedAt',
        {
          ':status': 'failed',
          ':error': processingError.message,
          ':updatedAt': new Date().toISOString(),
          '#status': 'status'
        }
      );

      throw processingError;
    }

  } catch (error) {
    console.error('NLP processing error:', error);
    res.status(500).json({ 
      error: 'Processing failed',
      message: error.message 
    });
  }
});

// Generate SEO analysis
router.post('/seo-analysis', checkSubscription('basic'), async (req, res) => {
  try {
    const { content, targetKeywords, targetAudience } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required for SEO analysis' });
    }

    const analysisPrompt = `Perform a comprehensive SEO analysis of the following content:

Target Keywords: ${targetKeywords || 'Not specified'}
Target Audience: ${targetAudience || 'General audience'}

Content to analyze:
${content}

Please provide:
1. SEO Score (0-100)
2. Keyword density analysis
3. Readability score
4. Content structure analysis (headings, paragraphs, etc.)
5. Meta description suggestions
6. Title tag suggestions
7. Improvement recommendations
8. Missing SEO elements

Format the response as a structured analysis with clear sections and actionable recommendations.`;

    const analysis = await BedrockService.invokeModel(analysisPrompt);

    res.json({
      message: 'SEO analysis completed',
      analysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('SEO analysis error:', error);
    res.status(500).json({ 
      error: 'SEO analysis failed',
      message: error.message 
    });
  }
});

// Generate content variations
router.post('/variations', checkSubscription('premium'), async (req, res) => {
  try {
    const { content, variationType, count = 3 } = req.body;

    if (!content || !variationType) {
      return res.status(400).json({ error: 'Content and variation type are required' });
    }

    const maxCount = req.user.subscriptionTier === 'enterprise' ? 10 : 5;
    const requestedCount = Math.min(count, maxCount);

    const variationPrompt = `Generate ${requestedCount} different variations of the following content for ${variationType} purposes:

Original Content:
${content}

Requirements:
- Maintain the core message and key information
- Optimize for ${variationType}
- Each variation should have a unique approach
- Ensure all variations are high-quality and engaging

Please provide ${requestedCount} distinct variations, each clearly numbered and separated.`;

    const variations = await BedrockService.invokeModel(variationPrompt);

    res.json({
      message: 'Content variations generated',
      variations,
      count: requestedCount,
      variationType,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Content variations error:', error);
    res.status(500).json({ 
      error: 'Content variations generation failed',
      message: error.message 
    });
  }
});

// Helper function to generate SEO metadata
async function generateSEOMetadata(content, filename) {
  const metadataPrompt = `Based on the following content, generate SEO metadata:

Content:
${content.substring(0, 2000)}...

Please provide:
1. Title tag (50-60 characters)
2. Meta description (150-160 characters)
3. 5-10 relevant keywords
4. Suggested URL slug
5. Open Graph title and description

Format as JSON with keys: title, description, keywords, slug, ogTitle, ogDescription`;

  try {
    const metadataResponse = await BedrockService.invokeModel(metadataPrompt);
    
    // Try to parse as JSON, fallback to structured text if needed
    try {
      return JSON.parse(metadataResponse);
    } catch {
      return {
        title: `SEO Optimized: ${filename}`,
        description: 'SEO optimized content generated with AI assistance',
        keywords: ['seo', 'content', 'optimization'],
        slug: filename.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        ogTitle: `SEO Optimized: ${filename}`,
        ogDescription: 'SEO optimized content generated with AI assistance'
      };
    }
  } catch (error) {
    console.error('SEO metadata generation error:', error);
    return {
      title: `SEO Optimized: ${filename}`,
      description: 'SEO optimized content generated with AI assistance',
      keywords: ['seo', 'content', 'optimization'],
      slug: filename.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      ogTitle: `SEO Optimized: ${filename}`,
      ogDescription: 'SEO optimized content generated with AI assistance'
    };
  }
}

// Helper function to format content as HTML
function formatAsHTML(content, seoMetadata) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${seoMetadata.title}</title>
    <meta name="description" content="${seoMetadata.description}">
    <meta name="keywords" content="${seoMetadata.keywords.join(', ')}">
    <meta property="og:title" content="${seoMetadata.ogTitle}">
    <meta property="og:description" content="${seoMetadata.ogDescription}">
    <meta property="og:type" content="article">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1, h2, h3 { color: #333; }
        p { margin-bottom: 1em; }
        .seo-info { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="seo-info">
        <h3>SEO Information</h3>
        <p><strong>Title:</strong> ${seoMetadata.title}</p>
        <p><strong>Description:</strong> ${seoMetadata.description}</p>
        <p><strong>Keywords:</strong> ${seoMetadata.keywords.join(', ')}</p>
    </div>
    
    <main>
        ${content.replace(/\n/g, '<br>')}
    </main>
</body>
</html>`;
}

module.exports = router;
