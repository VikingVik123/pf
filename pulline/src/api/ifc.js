import { apiClient } from './client'

export const ifcApi = {
  listProjects() {
    return apiClient.get('/ifc/projects').then((res) => res.data)
  },

  /**
   * Create an IFC project from an already-uploaded file.
   * @param {{ file_id?: string, filename?: string, project_name?: string }} payload
   */
  createProject(payload) {
    return apiClient.post('/ifc/projects', payload).then((res) => res.data)
  },

  processProject(projectId) {
    return apiClient.post(`/ifc/projects/${projectId}/process`).then((res) => res.data)
  },

  getProjectStatus(projectId) {
    return apiClient.get(`/ifc/projects/${projectId}/status`).then((res) => res.data)
  },

  getProject(projectId) {
    return apiClient.get(`/ifc/projects/${projectId}`).then((res) => res.data)
  },

  deleteProject(projectId) {
    return apiClient.delete(`/ifc/projects/${projectId}`).then((res) => res.data)
  },
}