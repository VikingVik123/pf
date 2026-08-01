import { apiClient } from './client'

export const ingestionApi = {
  /**
   * Upload a file. Returns immediately; processing happens server-side.
   * @param {File} file
   * @param {string=} filetype
   * @param {(percent: number) => void=} onProgress
   */
  uploadFile(file, filetype, onProgress) {
    const formData = new FormData()
    formData.append('file', file)

    return apiClient
      .post('/ingestion/upload', formData, {
        params: filetype ? { filetype } : undefined,
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          if (onProgress && event.total) {
            onProgress(Math.round((event.loaded * 100) / event.total))
          }
        },
      })
      .then((res) => res.data)
  },

  /**
   * List uploaded files for the current user.
   * @param {{ status?: string, page?: number, page_size?: number }=} params
   */
  listFiles(params = {}) {
    return apiClient.get('/ingestion/files', { params }).then((res) => res.data)
  },

  getFile(fileId) {
    return apiClient.get(`/ingestion/files/${fileId}`).then((res) => res.data)
  },

  deleteFile(fileId) {
    return apiClient.delete(`/ingestion/files/${fileId}`).then((res) => res.data)
  },

  /**
   * Download a file as a Blob (caller decides how to save/open it).
   */
  downloadFile(fileId) {
    return apiClient
      .get(`/ingestion/download/${fileId}`, { responseType: 'blob' })
      .then((res) => res.data)
  },

  getQueueStats() {
    return apiClient.get('/ingestion/queue/stats').then((res) => res.data)
  },
}