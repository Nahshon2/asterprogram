import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
  ...(process.env.S3_ENDPOINT && { endpoint: process.env.S3_ENDPOINT }),
})

const BUCKET = process.env.AWS_S3_BUCKET || 'doctor-identity-assets'

export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  folder: string = 'uploads'
): Promise<string> {
  const ext = path.extname(originalName)
  const key = `${folder}/${uuidv4()}${ext}`

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      Metadata: { originalName },
    })
  )

  return `https://${BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`
}

export async function deleteFile(url: string): Promise<void> {
  const key = url.split('.amazonaws.com/')[1]
  if (!key) return

  await s3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  )
}

export async function getPresignedUploadUrl(
  fileName: string,
  mimeType: string,
  folder: string = 'uploads'
): Promise<{ url: string; key: string }> {
  const ext = path.extname(fileName)
  const key = `${folder}/${uuidv4()}${ext}`

  const url = await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: mimeType,
    }),
    { expiresIn: 3600 }
  )

  return { url, key }
}
