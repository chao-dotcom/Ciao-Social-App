import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../../context/AuthContext';
import * as articlesAPI from '../../api/articles';

const ArticleForm = ({ onArticleCreated }) => {
  const [text, setText] = useState('');
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { user } = useAuth();
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 4,
    maxSize: 10 * 1024 * 1024, // 10MB
    onDrop: acceptedFiles => {
      if (acceptedFiles.length + images.length > 4) {
        setError('Maximum 4 images allowed');
        return;
      }
      
      setImages(prev => [...prev, ...acceptedFiles]);
      
      const newPreviews = acceptedFiles.map(file =>
        URL.createObjectURL(file)
      );
      setPreviews(prev => [...prev, ...newPreviews]);
      setError('');
    },
    onDropRejected: (fileRejections) => {
      setError(fileRejections[0].errors[0].message);
    }
  });
  
  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!text.trim()) {
      setError('Please enter some text');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('text', text);
      
      images.forEach(image => {
        formData.append('images', image);
      });
      
      const response = await articlesAPI.createArticle(formData);
      
      // Reset form
      setText('');
      setImages([]);
      setPreviews([]);
      
      if (onArticleCreated) {
        onArticleCreated(response.data.article);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="flex items-center gap-3">
        <img src={user?.avatar} alt={user?.username} className="w-10 h-10 rounded-full object-cover" />
        <div className="font-medium text-gray-800">{user?.displayName}</div>
      </div>

      <form onSubmit={handleSubmit} className="mt-3">
        <textarea
          placeholder="What's on your mind?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full border rounded p-2 resize-none"
          rows="4"
        />

        {previews.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {previews.map((preview, index) => (
              <div key={index} className="relative">
                <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-40 object-cover rounded" />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-white rounded-full p-1 shadow"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div {...getRootProps()} className={`mt-3 p-3 border-dashed border-2 rounded border-gray-200 text-center cursor-pointer ${isDragActive ? 'bg-gray-50' : ''}`}>
          <input {...getInputProps()} />
          <p className="text-sm text-gray-600">
            {isDragActive ? '📸 Drop images here...' : '📷 Drag & drop images, or click to select (max 4 images)'}
          </p>
        </div>

        {error && <div className="text-sm text-red-600 mt-2">{error}</div>}

        <div className="mt-3 flex justify-end">
          <button type="submit" disabled={loading} className="px-4 py-2 bg-teal-600 text-white rounded">
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ArticleForm;

