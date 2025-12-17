import React, { useState, useEffect } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import ArticleForm from '../components/article/ArticleForm';
import ArticleCard from '../components/article/ArticleCard';
import * as articlesAPI from '../api/articles';

const Feed = () => {
  const [articles, setArticles] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadArticles = async () => {
    try {
      const response = await articlesAPI.getFeed({ page, limit: 10 });
      const newArticles = response.data.articles;

      setArticles(prev => [...prev, ...newArticles]);
      setHasMore(response.data.pagination.hasNextPage);
      setPage(prev => prev + 1);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load articles:', error);
      setLoading(false);
    }
  };

  const handleArticleCreated = (newArticle) => {
    setArticles(prev => [newArticle, ...prev]);
  };

  const handleArticleDeleted = (articleId) => {
    setArticles(prev => prev.filter(article => article._id !== articleId));
  };

  const handleArticleUpdated = (updatedArticle) => {
    setArticles(prev =>
      prev.map(article =>
        article._id === updatedArticle._id ? updatedArticle : article
      )
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <ArticleForm onArticleCreated={handleArticleCreated} />
        </div>

        <InfiniteScroll
          dataLength={articles.length}
          next={loadArticles}
          hasMore={hasMore}
          loader={
            <div className="text-center py-4 text-gray-500">Loading more...</div>
          }
          endMessage={
            <p className="text-center py-4 text-gray-500">
              <b>🎉 You're all caught up!</b>
            </p>
          }
        >
          {articles.map(article => (
            <div key={article._id} className="mb-4">
              <ArticleCard
                article={article}
                onDelete={handleArticleDeleted}
                onUpdate={handleArticleUpdated}
              />
            </div>
          ))}
        </InfiniteScroll>

        {articles.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-600">
            <h2 className="text-2xl font-semibold">Your feed is empty</h2>
            <p className="mt-2">Follow people or create your first post to get started on Ciao.</p>
            <div className="mt-4 flex justify-center">
              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="px-4 py-2 bg-teal-600 text-white rounded">Create Post</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Feed;

