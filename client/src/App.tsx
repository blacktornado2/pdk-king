import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Home } from './pages/Home';
import { Merge } from './pages/Merge';
import { Split } from './pages/Split';
import { Reorder } from './pages/Reorder';
import { Compress } from './pages/Compress';
import { Unlock } from './pages/Unlock';
import { Protect } from './pages/Protect';
import { Rotate } from './pages/Rotate';
import { Extract } from './pages/Extract';
import { PdfToImages } from './pages/PdfToImages';
import { Watermark } from './pages/Watermark';
import { PageNumbers } from './pages/PageNumbers';
import { Metadata } from './pages/Metadata';
import { EditPdf } from './pages/EditPdf';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#fafafa]">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/merge" element={<Merge />} />
          <Route path="/split" element={<Split />} />
          <Route path="/reorder" element={<Reorder />} />
          <Route path="/compress" element={<Compress />} />
          <Route path="/unlock" element={<Unlock />} />
          <Route path="/protect" element={<Protect />} />
          <Route path="/rotate" element={<Rotate />} />
          <Route path="/extract" element={<Extract />} />
          <Route path="/to-images" element={<PdfToImages />} />
          <Route path="/watermark" element={<Watermark />} />
          <Route path="/page-numbers" element={<PageNumbers />} />
          <Route path="/metadata" element={<Metadata />} />
          <Route path="/edit" element={<EditPdf />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
