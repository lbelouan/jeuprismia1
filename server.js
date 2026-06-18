const express = require('express')
const path = require('path')

const PORT = process.env.PORT || 8082
const app = express()

app.use('/assets', express.static(path.resolve(__dirname, './assets')))
app.use('/dist', express.static(path.resolve(__dirname, './dist')))

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, './index.html'))
})

app.listen(PORT, () => {
  console.log(`Prismia Tower running at http://localhost:${PORT}`)
})
