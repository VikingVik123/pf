<template>
  <Teleport to="body">
    <div v-if="open" class="overlay" @click.self="handleClose">
      <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="new-project-title">
        <button class="close-btn" type="button" aria-label="Close" @click="handleClose">×</button>

        <p class="eyebrow">New project — 01</p>
        <h2 id="new-project-title">Upload an IFC model</h2>
        <p class="subhead">We'll process it into per-floor plans once created.</p>

        <form novalidate @submit.prevent="handleSubmit">
          <!-- Upload -->
          <div class="field">
            <label>IFC file</label>
            <input
              ref="fileInputRef"
              type="file"
              accept=".ifc"
              class="file-input-hidden"
              @change="handleFileSelected"
            />

            <div class="upload-box" :class="{ 'has-file': !!selectedFile }">
              <template v-if="!selectedFile">
                <button type="button" class="upload-btn" @click="fileInputRef?.click()">
                  Choose file
                </button>
                <span class="upload-hint">.ifc files only</span>
              </template>

              <template v-else>
                <div class="file-row">
                  <span class="file-icon" aria-hidden="true">▤</span>
                  <div class="file-info">
                    <span class="file-name">{{ selectedFile.name }}</span>
                    <span class="file-size">{{ formatFileSize(selectedFile.size) }}</span>
                  </div>
                  <button
                    type="button"
                    class="file-remove"
                    :disabled="uploading"
                    @click="resetFile"
                  >
                    ×
                  </button>
                </div>

                <div v-if="uploading" class="progress-track">
                  <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
                </div>
                <p v-if="uploading" class="upload-status">Uploading… {{ uploadProgress }}%</p>
                <p v-else-if="fileId" class="upload-status success">Uploaded</p>
                <p v-else-if="uploadError" class="upload-status error">{{ uploadError }}</p>
              </template>
            </div>
          </div>

          <!-- Project name -->
          <div class="field">
            <label for="project_name">Project name</label>
            <input
              id="project_name"
              v-model.trim="form.projectName"
              type="text"
              placeholder="e.g. Riverside Tower — Phase 1"
              :class="{ invalid: errors.projectName }"
              @blur="touched.projectName = true"
            />
            <p v-if="errors.projectName" class="field-error">{{ errors.projectName }}</p>
          </div>

          <!-- File name -->
          <div class="field">
            <label for="file_name">File name</label>
            <input
              id="file_name"
              v-model.trim="form.fileName"
              type="text"
              placeholder="Defaults to the uploaded file's name"
              :class="{ invalid: errors.fileName }"
              @blur="touched.fileName = true"
            />
            <p v-if="errors.fileName" class="field-error">{{ errors.fileName }}</p>
          </div>

          <p v-if="serverError" class="server-error" role="alert">{{ serverError }}</p>

          <div class="actions">
            <button type="button" class="btn-secondary" @click="handleClose">Cancel</button>
            <button type="submit" class="btn-primary" :disabled="!canSubmit">
              {{ creating ? 'Creating…' : 'Create project' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { reactive, computed, ref, watch } from 'vue'
import { ingestionApi } from '../api/ingestion'
import { ifcApi } from '../api/ifc'

const props = defineProps({
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'created'])

const fileInputRef = ref(null)
const selectedFile = ref(null)
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadError = ref('')
const fileId = ref(null)

const form = reactive({
  projectName: '',
  fileName: '',
})

const touched = reactive({
  projectName: false,
  fileName: false,
})

const creating = ref(false)
const serverError = ref('')

const errors = computed(() => {
  const e = {}
  if (touched.projectName && !form.projectName) {
    e.projectName = 'Project name is required.'
  }
  if (touched.fileName && !form.fileName) {
    e.fileName = 'File name is required.'
  }
  return e
})

const canSubmit = computed(() => {
  return (
    !!fileId.value &&
    !uploading.value &&
    !creating.value &&
    !!form.projectName &&
    !!form.fileName
  )
})

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

async function handleFileSelected(event) {
  const file = event.target.files?.[0]
  if (!file) return

  selectedFile.value = file
  fileId.value = null
  uploadError.value = ''

  // Pre-fill the file name field from the chosen file, unless the user
  // already typed something in.
  if (!form.fileName) form.fileName = file.name

  uploading.value = true
  uploadProgress.value = 0
  try {
    const result = await ingestionApi.uploadFile(file, 'ifc', (percent) => {
      uploadProgress.value = percent
    })
    fileId.value = result.id
  } catch (err) {
    uploadError.value =
      err.response?.data?.detail || 'Upload failed. Please try again.'
    selectedFile.value = null
  } finally {
    uploading.value = false
  }
}

function resetFile() {
  selectedFile.value = null
  fileId.value = null
  uploadProgress.value = 0
  uploadError.value = ''
  if (fileInputRef.value) fileInputRef.value.value = ''
}

async function handleSubmit() {
  touched.projectName = true
  touched.fileName = true
  serverError.value = ''

  if (!canSubmit.value) return

  creating.value = true
  try {
    const project = await ifcApi.createProject({
      file_id: fileId.value,
      filename: form.fileName,
      project_name: form.projectName,
    })
    emit('created', project)
    resetAndClose()
  } catch (err) {
    if (err.response?.status === 422) {
      serverError.value = 'Please check the form and try again.'
    } else {
      serverError.value =
        err.response?.data?.detail || 'Could not create the project. Please try again.'
    }
  } finally {
    creating.value = false
  }
}

function resetAndClose() {
  selectedFile.value = null
  fileId.value = null
  uploadProgress.value = 0
  uploadError.value = ''
  form.projectName = ''
  form.fileName = ''
  touched.projectName = false
  touched.fileName = false
  serverError.value = ''
  if (fileInputRef.value) fileInputRef.value.value = ''
  emit('close')
}

function handleClose() {
  if (uploading.value || creating.value) return
  resetAndClose()
}

// Reset internal state whenever the modal is closed from the outside too.
watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) resetAndClose()
  }
)
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(14, 34, 56, 0.45);
  display: grid;
  place-items: center;
  padding: 24px;
  z-index: 100;
}

.dialog {
  position: relative;
  width: 100%;
  max-width: 440px;
  max-height: 90vh;
  overflow-y: auto;
  background: #fffdf9;
  border: 1.5px solid #e4dfd2;
  border-radius: 8px;
  padding: 32px;
  font-family: 'Inter', sans-serif;
  color: #2a2e33;
  box-shadow: 0 20px 60px rgba(14, 34, 56, 0.25);
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  font-size: 20px;
  line-height: 1;
  color: #9aa3ac;
  cursor: pointer;
  border-radius: 4px;
}

.close-btn:hover {
  background: #f0ede4;
  color: #384049;
}

.eyebrow {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #2f6fa8;
  margin: 0 0 12px;
}

h2 {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 22px;
  font-weight: 600;
  margin: 0 0 6px;
  color: #17202b;
}

.subhead {
  margin: 0 0 24px;
  color: #5b6470;
  font-size: 14px;
  line-height: 1.5;
}

form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

label {
  font-size: 13px;
  font-weight: 500;
  color: #384049;
}

input[type='text'] {
  font-family: 'Inter', sans-serif;
  font-size: 14.5px;
  padding: 10px 12px;
  border: 1.5px solid #d8d3c6;
  border-radius: 3px;
  background: #fffdf9;
  color: #17202b;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

input[type='text']:focus {
  outline: none;
  border-color: #2f6fa8;
  box-shadow: 0 0 0 3px rgba(47, 111, 168, 0.15);
}

input.invalid {
  border-color: #c2531a;
}

.field-error {
  margin: 0;
  font-size: 12.5px;
  color: #c2531a;
}

.file-input-hidden {
  display: none;
}

.upload-box {
  border: 1.5px dashed #c9c2af;
  border-radius: 4px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-align: center;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.upload-box.has-file {
  align-items: stretch;
  text-align: left;
}

.upload-btn {
  padding: 8px 16px;
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 600;
  font-size: 13.5px;
  color: #0e2238;
  background: transparent;
  border: 1.5px solid #2f6fa8;
  border-radius: 3px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.upload-btn:hover {
  background: rgba(47, 111, 168, 0.08);
}

.upload-hint {
  font-size: 12px;
  color: #9aa3ac;
}

.file-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.file-icon {
  font-size: 18px;
  color: #2f6fa8;
}

.file-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.file-name {
  font-size: 13.5px;
  font-weight: 500;
  color: #17202b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  font-size: 12px;
  color: #9aa3ac;
}

.file-remove {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  font-size: 16px;
  color: #9aa3ac;
  cursor: pointer;
  border-radius: 4px;
}

.file-remove:hover:not(:disabled) {
  background: #f0ede4;
  color: #384049;
}

.file-remove:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.progress-track {
  margin-top: 10px;
  height: 4px;
  border-radius: 2px;
  background: #e8e4d8;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #2f6fa8;
  transition: width 0.15s ease;
}

.upload-status {
  margin: 8px 0 0;
  font-size: 12px;
  color: #7a8390;
}

.upload-status.success {
  color: #3f8f5f;
}

.upload-status.error {
  color: #c2531a;
}

.server-error {
  margin: 0;
  padding: 10px 12px;
  border: 1px solid #c2531a;
  background: rgba(194, 83, 26, 0.08);
  color: #a3431a;
  font-size: 13px;
  border-radius: 3px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 4px;
}

.btn-secondary,
.btn-primary {
  padding: 10px 18px;
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 600;
  font-size: 14px;
  border-radius: 3px;
  cursor: pointer;
  transition: background 0.15s ease, opacity 0.15s ease;
}

.btn-secondary {
  border: 1.5px solid #d8d3c6;
  background: transparent;
  color: #384049;
}

.btn-secondary:hover {
  background: #f0ede4;
}

.btn-primary {
  border: none;
  color: #f6f4ee;
  background: #0e2238;
}

.btn-primary:hover:not(:disabled) {
  background: #17324f;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>


