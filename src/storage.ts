import fs from 'node:fs'
import { Storage } from '@google-cloud/storage'
import Ffmpeg from 'fluent-ffmpeg'

const storage = new Storage()

const rawVideoBucket = 'tempName-raw-videos'
const processedVideoBucket = 'tempName-processed-videos'

const localRawVideoDirectory = '/tmp/raw-videos'
const localProcessedVideoDirectory = '/tmp/processed-videos'

export const setupDirectories = () => {
  ensureDirectoriesExist(localRawVideoDirectory)
  ensureDirectoriesExist(localProcessedVideoDirectory)
}

export const convertVideo = (
  rawVideoName: string,
  processedVideoName: string
) => {
  return new Promise<void>((resolve, reject) => {
    Ffmpeg(`${localRawVideoDirectory}/${rawVideoName}`)
      .outputOptions('-vf', 'scale=-1:420')
      .on('end', () => {
        console.log('Processing finished!')
        resolve(true)
      })
      .on('error', (err) => {
        console.log(err)
        reject(err)
      })
      .save(`${localProcessedVideoDirectory}/${processedVideoName}`)
  })
}

export const downloadRawVideo = async (rawFileName: string) => {
  await storage
    .bucket(rawVideoBucket)
    .file(rawFileName)
    .download({
      destination: `${localRawVideoDirectory}/${rawFileName}`,
    })

  console.log(
    `gs://${rawVideoBucket}/${rawFileName} downloaded to ${localRawVideoDirectory}/${rawFileName}`
  )
}

export const uploadProcessedVideo = async (processedFileName: string) => {
  const bucket = storage.bucket(processedVideoBucket)
  await bucket.upload(`${localProcessedVideoDirectory}/${processedFileName}`, {
    destination: processedFileName,
  })

  console.log(`gs://${processedVideoBucket}/${processedFileName} uploaded.`)

  await bucket.file(processedFileName).makePublic()
}

export const deleteRawVideo = async (rawFilePath: string) => {
  return new Promise<void>((resolve, reject) => {
    if (!fs.existsSync(rawFilePath)) {
      reject(new Error(`${rawFilePath} does not exist`))
    } else {
      fs.unlink(rawFilePath, (err) => {
        if (err) {
          console.log(`Failed to delete file at ${rawFilePath}`)
          reject(err)
        } else {
          console.log(`Failed to deleted at ${rawFilePath}`)
          resolve()
        }
      })
    }
  })
}

export const deleteProcessedVideo = async (processedFilePath: string) => {
  return new Promise<void>((resolve, reject) => {
    if (!fs.existsSync(processedFilePath)) {
      reject(new Error(`${processedFilePath} does not exist`))
    } else {
      fs.unlink(processedFilePath, (err) => {
        if (err) {
          console.log(`Failed to delete file at ${processedFilePath}`)
          reject(err)
        } else {
          console.log(`Failed to deleted at ${processedFilePath}`)
          resolve()
        }
      })
    }
  })
}

const ensureDirectoriesExist = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
    console.log(`directory created ${dirPath}`)
  }
}
