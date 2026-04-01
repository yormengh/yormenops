import { Routes, Route } from 'react-router-dom'
import Layout    from './components/Layout.jsx'
import Home      from './pages/Home.jsx'
import PostDetail from './pages/PostDetail.jsx'
import NewPost   from './pages/NewPost.jsx'
import EditPost  from './pages/EditPost.jsx'
import TagFeed   from './pages/TagFeed.jsx'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/"         element={<Home />} />
        <Route path="/post/:id" element={<PostDetail />} />
        <Route path="/new"      element={<NewPost />} />
        <Route path="/edit/:id" element={<EditPost />} />
        <Route path="/tag/:tag" element={<TagFeed />} />
      </Routes>
    </Layout>
  )
}
