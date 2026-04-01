import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.error || err.message || 'Something went wrong'
    return Promise.reject(new Error(msg))
  }
)

// Posts
export const getPosts    = (params) => api.get('/posts', { params })
export const getPost     = (id)     => api.get(`/posts/${id}`)
export const createPost  = (data)   => api.post('/posts', data)
export const updatePost  = (id, d)  => api.put(`/posts/${id}`, d)
export const deletePost  = (id)     => api.delete(`/posts/${id}`)
export const reactToPost = (id, r)  => api.post(`/posts/${id}/react`, { reaction: r })

// Comments (now on /posts/:id/comments)
export const getComments    = (postId) => api.get(`/posts/${postId}/comments`)
export const addComment     = (postId, data) => api.post(`/posts/${postId}/comments`, data)
export const deleteComment  = (postId, commentId) => api.delete(`/posts/${postId}/comments/${commentId}`)

// Tags
export const getTags = () => api.get('/tags')

export default api
