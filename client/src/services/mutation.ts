import axios, { AxiosError } from 'axios'

const serverURL = import.meta.env.VITE_SERVER_URL
if (!serverURL) throw new Error('Server URL not found!')
const apiURL = new URL(serverURL)

export async function filterCVMutation(data: { tags: string[] }) {
  try {
    const cvFilterURL = new URL('/cv', apiURL)
    const res = await axios.post(cvFilterURL.href, data, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    return res.data
  } catch (e) {
    if (e instanceof AxiosError) {
      const error = e.response?.data?.message ?? e.message
      throw new Error(error)
    }
    if (!(e instanceof Error)) throw new Error(`Error not Identified`)

    throw new Error(e.message)
  }
}

export async function cleanFileMutation() {
  try {
    const cleanFileURL = new URL('clean-errors', apiURL)
    const res = await axios.post(cleanFileURL.href)
    return res.data
  } catch (e) {
    if (e instanceof AxiosError) {
      const error = e.response?.data?.message ?? e.message
      throw new Error(error)
    }
    if (!(e instanceof Error)) throw new Error(`Error not Identified`)

    throw new Error(e.message)
  }
}
