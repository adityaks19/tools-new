const { s3, UPLOADS_BUCKET, PROCESSED_BUCKET } = require('../config/aws');
const { v4: uuidv4 } = require('uuid');

class S3Service {
  // Upload file to S3
  async uploadFile(file, userId, fileType = 'upload') {
    const bucket = fileType === 'processed' ? PROCESSED_BUCKET : UPLOADS_BUCKET;
    const key = `${userId}/${uuidv4()}-${file.originalname}`;
    
    const params = {
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        userId: userId,
        originalName: file.originalname,
        uploadDate: new Date().toISOString()
      }
    };

    try {
      const result = await s3.upload(params).promise();
      return {
        success: true,
        key: key,
        location: result.Location,
        bucket: bucket,
        etag: result.ETag
      };
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new Error('Failed to upload file to S3');
    }
  }

  // Get file from S3
  async getFile(bucket, key) {
    const params = {
      Bucket: bucket,
      Key: key
    };

    try {
      const result = await s3.getObject(params).promise();
      return {
        success: true,
        body: result.Body,
        contentType: result.ContentType,
        metadata: result.Metadata
      };
    } catch (error) {
      console.error('S3 get file error:', error);
      throw new Error('Failed to retrieve file from S3');
    }
  }

  // Delete file from S3
  async deleteFile(bucket, key) {
    const params = {
      Bucket: bucket,
      Key: key
    };

    try {
      await s3.deleteObject(params).promise();
      return { success: true };
    } catch (error) {
      console.error('S3 delete error:', error);
      throw new Error('Failed to delete file from S3');
    }
  }

  // Generate presigned URL for direct upload
  async generatePresignedUrl(userId, fileName, contentType, expiresIn = 3600) {
    const key = `${userId}/${uuidv4()}-${fileName}`;
    
    const params = {
      Bucket: UPLOADS_BUCKET,
      Key: key,
      ContentType: contentType,
      Expires: expiresIn,
      Metadata: {
        userId: userId,
        originalName: fileName
      }
    };

    try {
      const url = await s3.getSignedUrlPromise('putObject', params);
      return {
        success: true,
        uploadUrl: url,
        key: key
      };
    } catch (error) {
      console.error('S3 presigned URL error:', error);
      throw new Error('Failed to generate presigned URL');
    }
  }

  // List user files
  async listUserFiles(userId, bucket = UPLOADS_BUCKET) {
    const params = {
      Bucket: bucket,
      Prefix: `${userId}/`
    };

    try {
      const result = await s3.listObjectsV2(params).promise();
      return {
        success: true,
        files: result.Contents.map(file => ({
          key: file.Key,
          size: file.Size,
          lastModified: file.LastModified,
          etag: file.ETag
        }))
      };
    } catch (error) {
      console.error('S3 list files error:', error);
      throw new Error('Failed to list user files');
    }
  }

  // Copy file between buckets
  async copyFile(sourceKey, destinationKey, sourceBucket = UPLOADS_BUCKET, destBucket = PROCESSED_BUCKET) {
    const params = {
      Bucket: destBucket,
      CopySource: `${sourceBucket}/${sourceKey}`,
      Key: destinationKey
    };

    try {
      const result = await s3.copyObject(params).promise();
      return {
        success: true,
        etag: result.ETag,
        key: destinationKey
      };
    } catch (error) {
      console.error('S3 copy error:', error);
      throw new Error('Failed to copy file');
    }
  }

  // Get file metadata
  async getFileMetadata(bucket, key) {
    const params = {
      Bucket: bucket,
      Key: key
    };

    try {
      const result = await s3.headObject(params).promise();
      return {
        success: true,
        contentType: result.ContentType,
        contentLength: result.ContentLength,
        lastModified: result.LastModified,
        metadata: result.Metadata,
        etag: result.ETag
      };
    } catch (error) {
      console.error('S3 metadata error:', error);
      throw new Error('Failed to get file metadata');
    }
  }

  // Create multipart upload for large files
  async createMultipartUpload(userId, fileName, contentType) {
    const key = `${userId}/${uuidv4()}-${fileName}`;
    
    const params = {
      Bucket: UPLOADS_BUCKET,
      Key: key,
      ContentType: contentType,
      Metadata: {
        userId: userId,
        originalName: fileName
      }
    };

    try {
      const result = await s3.createMultipartUpload(params).promise();
      return {
        success: true,
        uploadId: result.UploadId,
        key: key
      };
    } catch (error) {
      console.error('S3 multipart upload creation error:', error);
      throw new Error('Failed to create multipart upload');
    }
  }

  // Generate presigned URL for multipart upload part
  async generateMultipartPresignedUrl(bucket, key, uploadId, partNumber) {
    const params = {
      Bucket: bucket,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
      Expires: 3600
    };

    try {
      const url = await s3.getSignedUrlPromise('uploadPart', params);
      return {
        success: true,
        uploadUrl: url
      };
    } catch (error) {
      console.error('S3 multipart presigned URL error:', error);
      throw new Error('Failed to generate multipart presigned URL');
    }
  }

  // Complete multipart upload
  async completeMultipartUpload(bucket, key, uploadId, parts) {
    const params = {
      Bucket: bucket,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts
      }
    };

    try {
      const result = await s3.completeMultipartUpload(params).promise();
      return {
        success: true,
        location: result.Location,
        etag: result.ETag
      };
    } catch (error) {
      console.error('S3 complete multipart upload error:', error);
      throw new Error('Failed to complete multipart upload');
    }
  }
}

module.exports = new S3Service();
