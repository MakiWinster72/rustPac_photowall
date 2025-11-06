import { useState, useEffect } from 'react'
import axios from 'axios'

function App() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [formData, setFormData] = useState({
    file: null,
    title: '',
    description: ''
  })
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    fetchPhotos()
  }, [])

  const fetchPhotos = async () => {
    try {
      const response = await axios.get('/api/photos')
      setPhotos(response.data)
    } catch (error) {
      console.error('获取照片失败:', error)
      alert('获取照片失败')
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData({ ...formData, file })
      const reader = new FileReader()
      reader.onloadend = () => setPreview(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.file || !formData.title) {
      alert('请选择文件并填写标题')
      return
    }

    setLoading(true)
    const data = new FormData()
    data.append('file', formData.file)
    data.append('title', formData.title)
    if (formData.description) {
      data.append('description', formData.description)
    }

    try {
      await axios.post('/api/photos', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      alert('上传成功！')
      setFormData({ file: null, title: '', description: '' })
      setPreview(null)
      setShowUpload(false)
      fetchPhotos()
    } catch (error) {
      console.error('上传失败:', error)
      alert('上传失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id, title) => {
    if (!confirm(`确定要删除 "${title}" 吗？`)) return

    try {
      await axios.delete(`/api/photos/${id}`)
      alert('删除成功！')
      fetchPhotos()
    } catch (error) {
      console.error('删除失败:', error)
      alert('删除失败')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* 头部 */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">📸 我的照片墙</h1>
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition duration-200 font-semibold"
          >
            {showUpload ? '❌ 取消' : '➕ 上传照片'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 上传表单 */}
        {showUpload && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">上传新照片</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  选择照片 *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="w-full border-2 border-gray-300 rounded-lg p-2"
                  required
                />
                {preview && (
                  <img
                    src={preview}
                    alt="预览"
                    className="mt-4 max-w-xs rounded-lg shadow-md"
                  />
                )}
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  标题 *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border-2 border-gray-300 rounded-lg p-2"
                  placeholder="给照片起个标题"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border-2 border-gray-300 rounded-lg p-2"
                  rows="3"
                  placeholder="描述一下这张照片..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white py-3 rounded-lg font-bold transition duration-200"
              >
                {loading ? '上传中...' : '🚀 立即上传'}
              </button>
            </form>
          </div>
        )}

        {/* 照片网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition duration-300"
            >
              <img
                src={`/uploads/${photo.filename}`}
                alt={photo.title}
                className="w-full h-64 object-cover"
              />
              <div className="p-4">
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {photo.title}
                </h3>
                {photo.description && (
                  <p className="text-gray-600 mb-3">{photo.description}</p>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {new Date(photo.upload_time).toLocaleDateString('zh-CN')}
                  </span>
                  <button
                    onClick={() => handleDelete(photo.id, photo.title)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded transition duration-200"
                  >
                    🗑️ 删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {photos.length === 0 && (
          <div className="text-center py-16">
            <p className="text-2xl text-gray-400">还没有照片，快去上传第一张吧！</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
