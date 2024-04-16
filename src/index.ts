import express from 'express'
import {
  convertVideo,
  deleteProcessedVideo,
  deleteRawVideo,
  downloadRawVideo,
  setupDirectories,
  uploadProcessedVideo,
} from './storage'

setupDirectories()

const app = express()
app.use(express.json())

app.post('/process-video', async (req, res) => {
  // get filename from request body from cloud pub/sub message
  let parsedData
  try {
    const data = Buffer.from(req.body.message.data, 'base64').toString('utf8')
    parsedData = JSON.parse(data)
    if (!parsedData.name) {
      throw new Error('Invalid message payload recieved.')
    }
  } catch (error) {
    console.log(error)
    res.status(400).send('Bad Request: missing filename')
  }

  //   file name for saving
  const fileName = parsedData.name
  const outputFileName = `proc-${fileName}`

  //   download raw video
  await downloadRawVideo(fileName)

  // upload processed video to GCS

  try {
    // converting raw video
    await convertVideo(fileName, outputFileName)
  } catch (error) {
    console.log(error)
    res.status(500).send('video processing failed.')
  } finally {
    await Promise.all([
      deleteRawVideo(fileName),
      deleteProcessedVideo(outputFileName),
    ])
  }

  await uploadProcessedVideo(outputFileName)

  await Promise.all([
    deleteRawVideo(fileName),
    deleteProcessedVideo(outputFileName),
  ])

  return res.status(200).send('video processing completed.')
})

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
