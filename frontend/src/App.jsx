import { useState, useEffect } from 'react'
import axios from 'axios'

function App() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [formData, setFormData] = useState({
    file: null,
    title: '',
    description: ''
  })
  const [preview, setPreview] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  useEffect(() => {
    fetchPhotos()
  }, [])

  const fetchPhotos = async () => {
    try {
      const response = await axios.get('/api/photos')
      setPhotos(response.data)
    } catch (error) {
      console.error('获取照片失败:', error)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('文件大小不能超过 10MB')
        return
      }
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
    setUploadProgress(0)
    const data = new FormData()
    data.append('file', formData.file)
    data.append('title', formData.title)
    if (formData.description) {
      data.append('description', formData.description)
    }

    try {
      await axios.post('/api/photos', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setUploadProgress(progress)
        }
      })
      
      setFormData({ file: null, title: '', description: '' })
      setPreview(null)
      setShowUpload(false)
      setUploadProgress(0)
      fetchPhotos()
      
      // 成功提示
      showToast('上传成功！', 'success')
    } catch (error) {
      console.error('上传失败:', error)
      showToast('上传失败，请重试', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id, title) => {
    if (!confirm(`确定要删除 "${title}" 吗？`)) return

    try {
      await axios.delete(`/api/photos/${id}`)
      showToast('删除成功！', 'success')
      setSelectedPhoto(null)
      fetchPhotos()
    } catch (error) {
      console.error('删除失败:', error)
      showToast('删除失败，请重试', 'error')
    }
  }

  const showToast = (message, type) => {
    const toast = document.createElement('div')
    toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white z-50 animate-slide-in ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    }`
    toast.textContent = message
    document.body.appendChild(toast)
    setTimeout(() => {
      toast.classList.add('animate-slide-out')
      setTimeout(() => document.body.removeChild(toast), 300)
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* 头部导航 */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">📸</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  照片墙
                </h1>
                <p className="text-xs text-gray-500">{photos.length} 张照片</p>
              </div>
            </div>
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="group relative px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 overflow-hidden"
            >
              <span className="relative z-10 flex items-center space-x-2">
                <span>{showUpload ? '✕' : '+'}</span>
                <span className="hidden sm:inline">{showUpload ? '取消' : '上传照片'}</span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 上传表单 */}
        <div
          className={`transition-all duration-500 ease-out transform ${
            showUpload
              ? 'opacity-100 translate-y-0 max-h-[1000px] mb-8'
              : 'opacity-0 -translate-y-4 max-h-0 overflow-hidden'
          }`}
        >
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
              <span className="mr-2">✨</span>
              上传新照片
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 文件上传区域 */}
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                  disabled={loading}
                />
                <label
                  htmlFor="file-upload"
                  className="block w-full cursor-pointer"
                >
                  {preview ? (
                    <div className="relative group">
                      <img
                        src={preview}
                        alt="预览"
                        className="w-full h-64 sm:h-80 object-cover rounded-xl shadow-md"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl flex items-center justify-center">
                        <span className="text-white font-semibold">点击更换图片</span>
                      </div>
                    </div>
                  ) : (
                    <div className="border-3 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-200">
                      <div className="text-6xl mb-4">📤</div>
                      <p className="text-lg font-semibold text-gray-700 mb-2">
                        点击或拖拽上传照片
                      </p>
                      <p className="text-sm text-gray-500">
                        支持 JPG、PNG、GIF，最大 10MB
                      </p>
                    </div>
                  )}
                </label>
              </div>

              {/* 标题输入 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  标题 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none"
                  placeholder="给照片起个名字..."
                  required
                  disabled={loading}
                />
              </div>

              {/* 描述输入 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none resize-none"
                  rows="3"
                  placeholder="分享这张照片的故事..."
                  disabled={loading}
                />
              </div>

              {/* 上传进度条 */}
              {loading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>上传中...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* 提交按钮 */}
              <button
                type="submit"
                disabled={loading || !formData.file || !formData.title}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl disabled:shadow-none transform hover:scale-[1.02] disabled:scale-100 transition-all duration-200 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center space-x-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>上传中 {uploadProgress}%</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center space-x-2">
                    <span>🚀</span>
                    <span>立即上传</span>
                  </span>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* 照片网格 */}
        {photos.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-8xl mb-6">📷</div>
            <h3 className="text-2xl font-bold text-gray-400 mb-2">还没有照片</h3>
            <p className="text-gray-500">点击上方按钮上传第一张照片吧！</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className="group relative bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:scale-[1.02]"
                style={{
                  animation: `fadeInUp 0.5s ease-out ${index * 0.05}s both`
                }}
                onClick={() => setSelectedPhoto(photo)}
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={`/uploads/${photo.filename}`}
                    alt={photo.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="font-bold text-lg mb-1 truncate">{photo.title}</h3>
                    {photo.description && (
                      <p className="text-sm text-gray-200 line-clamp-2">{photo.description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 照片详情弹窗 */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 关闭按钮 */}
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
            >
              <span className="text-2xl text-gray-700">×</span>
            </button>

            <div className="flex flex-col md:flex-row max-h-[90vh]">
              {/* 图片区域 */}
              <div className="md:w-2/3 bg-gray-100 flex items-center justify-center overflow-hidden">
                <img
                  src={`/uploads/${selectedPhoto.filename}`}
                  alt={selectedPhoto.title}
                  className="max-w-full max-h-[60vh] md:max-h-[90vh] object-contain"
                />
              </div>

              {/* 信息区域 */}
              <div className="md:w-1/3 p-6 sm:p-8 flex flex-col overflow-y-auto">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
                  {selectedPhoto.title}
                </h2>
                
                {selectedPhoto.description && (
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {selectedPhoto.description}
                  </p>
                )}

                <div className="flex items-center text-sm text-gray-500 mb-8">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(selectedPhoto.upload_time).toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>

                <div className="mt-auto space-y-3">
                  <a
                    href={`/uploads/${selectedPhoto.filename}`}
                    download
                    className="block w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-semibold text-center transition-colors duration-200"
                  >
                    📥 下载照片
                  </a>
                  <button
                    onClick={() => handleDelete(selectedPhoto.id, selectedPhoto.title)}
                    className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-semibold transition-colors duration-200"
                  >
                    🗑️ 删除照片
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 自定义动画样式 */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slide-out {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }

        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }

        .animate-slide-out {
          animation: slide-out 0.3s ease-out;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}

export default App
