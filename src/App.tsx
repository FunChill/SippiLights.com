import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { Layout } from './components/Layout'
import { BuilderProvider } from './context/BuilderContext'
import Home from './pages/Home'
import Services from './pages/Services'
import Portfolio from './pages/Portfolio'
import HowItWorks from './pages/HowItWorks'
import About from './pages/About'
import Contact from './pages/Contact'
import Builder from './pages/Builder'
import Book from './pages/Book'
import BookConfirmed from './pages/BookConfirmed'
import Faq from './pages/Faq'
import Occasion from './pages/Occasion'
import Feedback from './pages/Feedback'

// Owner-only page — split out of the customer bundle.
const Admin = lazy(() => import('./pages/Admin'))

function App() {
  return (
    <BrowserRouter>
      <BuilderProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/builder" element={<Builder />} />
            <Route path="/book" element={<Book />} />
            <Route path="/book/confirmed" element={<BookConfirmed />} />
            <Route path="/faq" element={<Faq />} />
            <Route path="/rentals/:slug" element={<Occasion />} />
            <Route path="/feedback/:token" element={<Feedback />} />
            <Route
              path="/admin/*"
              element={
                <Suspense
                  fallback={<div className="px-6 py-24 text-center text-text-muted">Loading…</div>}
                >
                  <Admin />
                </Suspense>
              }
            />
          </Routes>
        </Layout>
      </BuilderProvider>
      <Analytics />
    </BrowserRouter>
  )
}

export default App
