<template>
  <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal settings-modal" :class="{ 'edit-mode': mode === 'edit' }">
      <div class="modal-header">
        <h2>{{ mode === 'edit' ? '编辑 Jenkins 实例' : '添加 Jenkins 实例' }}</h2>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>

      <div class="modal-body">
        <form @submit.prevent="handleSubmit">
          <div class="form-row">
            <div class="form-group">
              <label>显示名称</label>
              <input
                v-model="form.name"
                type="text"
                placeholder="例如：测试环境"
                required
              />
            </div>

            <div class="form-group">
              <label>Jenkins URL</label>
              <input
                v-model="form.url"
                type="url"
                placeholder="https://jenkins.example.com"
                required
              />
            </div>

            <div class="form-group">
              <label>用户名</label>
              <input
                v-model="form.username"
                type="text"
                placeholder="Jenkins 用户名"
                required
              />
            </div>

            <div class="form-group">
              <label>API Token</label>
              <input
                v-model="form.apiToken"
                type="password"
                :placeholder="mode === 'edit' ? '留空保持不变' : 'Jenkins API Token'"
              />
            </div>
          </div>

          <span class="help-text">
            获取 Token：登录 Jenkins → 点击用户名 → Configure → API Token → Add new Token
          </span>

          <div v-if="formError" class="error-text">{{ formError }}</div>

          <div class="form-actions">
            <button
              v-if="mode === 'edit'"
              type="button"
              class="btn btn-danger"
              @click="handleDelete"
            >
              删除实例
            </button>
            <button type="button" class="btn btn-default" @click="$emit('close')">
              取消
            </button>
            <button type="submit" class="btn btn-primary" :disabled="formLoading">
              {{ formLoading ? '验证中...' : (mode === 'edit' ? '保存' : '测试并添加') }}
            </button>
          </div>
        </form>

        <!-- 管理其他实例 -->
        <div v-if="mode === 'add' && instances.length > 0" class="manage-section">
          <h3>已配置的实例</h3>
          <div class="instance-list">
            <div
              v-for="instance in instances"
              :key="instance._id"
              class="instance-item"
              @click="switchToEdit(instance._id)"
            >
              <div class="instance-info">
                <span class="instance-name">{{ instance.name }}</span>
                <span class="instance-url">{{ instance.url }}</span>
              </div>
              <span class="instance-edit-icon" :title="'编辑 ' + instance.name">›</span>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <div class="security-notice">
          <span class="lock-icon"></span>
          <span class="security-text">
            数据安全：本插件开源透明，所有配置仅保存在你的本地设备，不上传任何服务器。<br>
            <a href="https://github.com/kshq1996/ztools-jenkins" target="_blank">
              github.com/kshq1996/ztools-jenkins
            </a>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { useInstances } from '../composables/useInstances'
import type { JenkinsInstance } from '../types'

const props = defineProps<{
  show: boolean
  /** 编辑模式：传入要编辑的实例 id；新增模式：留空 */
  editInstanceId?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { instances, addInstance, updateInstance, deleteInstance } = useInstances()

const mode = ref<'add' | 'edit'>('add')
const form = reactive({
  name: '',
  url: '',
  username: '',
  apiToken: ''
})
const formLoading = ref(false)
const formError = ref<string | null>(null)

/**
 * 加载要编辑的实例数据
 */
watch(() => props.editInstanceId, (id) => {
  if (id) {
    mode.value = 'edit'
    const instance = instances.value.find(i => i._id === id)
    if (instance) {
      form.name = instance.name
      form.url = instance.url
      form.username = instance.username
      form.apiToken = ''
    }
  } else {
    mode.value = 'add'
    form.name = ''
    form.url = ''
    form.username = ''
    form.apiToken = ''
  }
  formError.value = null
}, { immediate: true })

watch(() => props.show, (show) => {
  if (show && props.editInstanceId) {
    const instance = instances.value.find(i => i._id === props.editInstanceId)
    if (instance) {
      form.name = instance.name
      form.url = instance.url
      form.username = instance.username
      form.apiToken = ''
    }
  }
  if (!show) {
    formError.value = null
  }
})

/**
 * 提交表单
 */
const handleSubmit = async () => {
  formLoading.value = true
  formError.value = null

  if (mode.value === 'edit') {
    const data: Partial<JenkinsInstance> = {
      name: form.name,
      url: form.url,
      username: form.username
    }
    if (form.apiToken) {
      data.apiToken = form.apiToken
    }

    const result = await updateInstance(props.editInstanceId!, data)
    formLoading.value = false

    if (result.success) {
      window.ztools.showNotification('实例已更新', 'Jenkins Lite')
      emit('close')
    } else {
      formError.value = result.error || '更新失败'
    }
  } else {
    const result = await addInstance({
      name: form.name,
      url: form.url,
      username: form.username,
      apiToken: form.apiToken
    })
    formLoading.value = false

    if (result.success) {
      form.name = ''
      form.url = ''
      form.username = ''
      form.apiToken = ''
      window.ztools.showNotification('实例添加成功', 'Jenkins Lite')
      emit('close')
    } else {
      formError.value = result.error || '添加失败'
    }
  }
}

/**
 * 删除实例
 */
const handleDelete = () => {
  if (confirm('确定要删除这个实例吗？')) {
    deleteInstance(props.editInstanceId!)
    window.ztools.showNotification('实例已删除', 'Jenkins Lite')
    emit('close')
  }
}

/**
 * 切换到编辑某个实例
 */
const switchToEdit = (id: string) => {
  const instance = instances.value.find(i => i._id === id)
  if (instance) {
    form.name = instance.name
    form.url = instance.url
    form.username = instance.username
    form.apiToken = ''
    mode.value = 'edit'
    // 直接修改 props 不允许，需要通过 emit 让父组件更新
    formError.value = null
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.settings-modal {
  background: var(--bg-color, #fff);
  border-radius: 8px;
  width: 720px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.settings-modal.edit-mode {
  width: 720px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid var(--border-color, #e0e0e0);
}

.modal-header h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.close-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  font-size: 20px;
  cursor: pointer;
  border-radius: 4px;
  color: var(--text-color, #333);
}

.close-btn:hover {
  background: var(--bg-hover, #f0f0f0);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.modal-footer {
  padding: 12px 20px;
  border-top: 1px solid var(--border-color, #e0e0e0);
  background: var(--bg-secondary, #f5f5f5);
  border-radius: 0 0 8px 8px;
}

.security-notice {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 11px;
  color: var(--text-secondary, #666);
  line-height: 1.6;
}

.security-text {
  flex: 1;
}

.lock-icon {
  width: 14px;
  height: 14px;
  margin-top: 2px;
  background: var(--primary-color, #0078d4);
  flex-shrink: 0;
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M19 10h-1V8c0-3.31-2.69-6-6-6S6 4.69 6 8v2H5c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-8c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-7H8.9V8c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z'/%3E%3C/svg%3E") center/contain no-repeat;
  -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M19 10h-1V8c0-3.31-2.69-6-6-6S6 4.69 6 8v2H5c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-8c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-7H8.9V8c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z'/%3E%3C/svg%3E") center/contain no-repeat;
}

.security-notice a {
  color: var(--primary-color, #0078d4);
  text-decoration: none;
}

.security-notice a:hover {
  text-decoration: underline;
}

/* 横向布局：4 列 */
.form-row {
  display: grid;
  grid-template-columns: 1fr 1.5fr 1fr 1fr;
  gap: 12px;
  margin-bottom: 8px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 4px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-color, #333);
}

.form-group input {
  padding: 8px 10px;
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 4px;
  font-size: 13px;
  box-sizing: border-box;
  background: var(--bg-color, #fff);
  color: var(--text-color, #333);
  transition: border-color 0.15s;
}

.form-group input::placeholder {
  color: var(--text-secondary, #999);
}

.form-group input:focus {
  outline: none;
  border-color: var(--primary-color, #0078d4);
}

.help-text {
  display: block;
  margin: 8px 0 16px;
  font-size: 11px;
  color: var(--text-secondary, #888);
}

.error-text {
  margin-bottom: 12px;
  padding: 8px 12px;
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 4px;
  color: #ff4d4f;
  font-size: 12px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 4px;
}

.btn {
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: opacity 0.15s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--primary-color, #0078d4);
  border: 1px solid var(--primary-color, #0078d4);
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: #006abc;
}

.btn-default {
  background: var(--bg-color, #fff);
  border: 1px solid var(--border-color, #e0e0e0);
  color: var(--text-color, #333);
}

.btn-default:hover {
  background: var(--bg-hover, #f5f5f5);
}

.btn-danger {
  background: var(--bg-color, #fff);
  border: 1px solid #ff4d4f;
  color: #ff4d4f;
  margin-right: auto;
}

.btn-danger:hover {
  background: #fff2f0;
}

/* 管理已有实例 */
.manage-section {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color, #e0e0e0);
}

.manage-section h3 {
  margin: 0 0 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-color, #333);
}

.instance-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.instance-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: var(--bg-secondary, #f5f5f5);
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
}

.instance-item:hover {
  background: var(--bg-hover, rgba(0,120,212,0.08));
}

.instance-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.instance-name {
  font-weight: 500;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.instance-url {
  font-size: 11px;
  color: var(--text-secondary, #888);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.instance-edit-icon {
  font-size: 18px;
  color: var(--text-secondary, #888);
  margin-left: 8px;
}

/* 暗黑模式适配 */
@media (prefers-color-scheme: dark) {
  .error-text {
    background: rgba(255, 77, 79, 0.1);
    border-color: rgba(255, 77, 79, 0.3);
  }

  .btn-danger:hover {
    background: rgba(255, 77, 79, 0.1);
  }
}
</style>