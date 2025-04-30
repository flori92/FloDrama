import axios from 'axios'

export async function getContentDetail(id: string) {
  const response = await axios.get(`/api/content/${id}`)
  return response.data
}
