<script setup lang="ts">
import { ref } from 'vue'
import { fetchUsers, triggerApiError } from './api'

interface User {
  id: number
  name: string
  email: string
}

const users = ref<User[]>([])
const loading = ref(false)
const status = ref('')

async function handleFetchUsers() {
  loading.value = true
  status.value = 'Fetching users...'
  try {
    users.value = await fetchUsers()
    status.value = `Fetched ${users.value.length} users`
  } catch (e) {
    status.value = `Error: ${e instanceof Error ? e.message : 'Unknown'}`
  } finally {
    loading.value = false
  }
}

function handleTriggerError() {
  status.value = 'Triggering JS error...'
  throw new Error('Manual error triggered from Vue app!')
}

async function handleApiError() {
  status.value = 'Triggering API error...'
  try {
    await triggerApiError()
  } catch (e) {
    status.value = `API Error caught: ${e instanceof Error ? e.message : 'Unknown'}`
  }
}

function handleUnhandledRejection() {
  status.value = 'Triggering unhandled promise rejection...'
  Promise.reject(new Error('Unhandled promise rejection!'))
}
</script>

<template>
  <div style="padding: 20px; max-width: 800px; margin: 0 auto">
    <h1>ErrorWatch Vue Test</h1>
    <p style="color: #666">
      Test the SDK with JSONPlaceholder API calls and manual errors.
    </p>

    <div style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px">
      <h3>Actions</h3>
      <div style="display: flex; gap: 10px; flex-wrap: wrap">
        <button
          @click="handleFetchUsers"
          :disabled="loading"
          style="background: #42b883; color: white"
        >
          {{ loading ? 'Loading...' : 'Fetch Users (JSONPlaceholder)' }}
        </button>
        <button
          @click="handleTriggerError"
          style="background: #e00; color: white"
        >
          Trigger JS Error
        </button>
        <button
          @click="handleApiError"
          style="background: #f60; color: white"
        >
          Trigger API Error (404)
        </button>
        <button
          @click="handleUnhandledRejection"
          style="background: #909; color: white"
        >
          Unhandled Promise Rejection
        </button>
      </div>

      <p
        v-if="status"
        style="margin-top: 15px; padding: 10px; background: #f0f0f0; border-radius: 4px; font-family: monospace; font-size: 13px"
      >
        {{ status }}
      </p>
    </div>

    <div
      v-if="users.length"
      style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1)"
    >
      <h3>Users from JSONPlaceholder</h3>
      <ul style="list-style: none; padding: 0">
        <li
          v-for="u in users.slice(0, 5)"
          :key="u.id"
          style="padding: 8px 0; border-bottom: 1px solid #eee"
        >
          <strong>{{ u.name }}</strong>
          <br />
          <span style="color: #666; font-size: 13px">{{ u.email }}</span>
        </li>
      </ul>
    </div>

    <div style="margin-top: 30px; padding: 15px; background: #fffde7; border-radius: 8px; font-size: 13px">
      <strong>Instructions:</strong>
      <ol style="margin: 10px 0; padding-left: 20px">
        <li>Open browser DevTools (F12) to see SDK logs</li>
        <li>Click buttons to trigger errors</li>
        <li>Go to Dashboard &rarr; Settings &rarr; Data &rarr; Disable "Event Ingestion"</li>
        <li>Trigger an error again - you should see "INGESTION_DISABLED" in console</li>
      </ol>
    </div>
  </div>
</template>
