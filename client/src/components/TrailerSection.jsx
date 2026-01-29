import React, { useState } from 'react'
import { dummyTrailers } from '../assets/assets'
import { PlayCircleIcon } from 'lucide-react'
import BlurCircle from './BlurCircle'

const TrailerSection = () => {
  const [currentTrailer, setCurrentTrailer] = useState(dummyTrailers[0])

  // Helper function to extract Video ID from YouTube URL
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return "";
    let videoId = "";
    
    // Video ID extraction logic
    if (url.includes("youtu.be")) {
        videoId = url.split("/").pop();
    } 
    else if (url.includes("watch?v=")) {
        videoId = url.split("v=")[1];
        const ampersandPosition = videoId.indexOf('&');
        if (ampersandPosition !== -1) {
            videoId = videoId.substring(0, ampersandPosition);
        }
    }
    
    // Change: autoplay=0 kar diya hai
    return `https://www.youtube.com/embed/${videoId}?rel=0&showinfo=0&autoplay=0`;
  }

  return (
    <div className='px-6 md:px-16 lg:px-24 xl:px-44 py-20 overflow-hidden text-white'>
      <p className='text-gray-300 font-medium text-lg max-w-4xl mx-auto mb-6'>
        Trailers
      </p>

      <div className="relative mt-6 flex justify-center aspect-video max-w-5xl mx-auto">
        <BlurCircle top='-100px' right='-100px' />

        <div className="w-full h-full rounded-xl overflow-hidden relative z-10 bg-black shadow-2xl border border-gray-800">
          <iframe
            key={currentTrailer.videoUrl} 
            className="w-full h-full rounded-xl"
            src={getYouTubeEmbedUrl(currentTrailer.videoUrl)}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" // 'autoplay' permission hata di
            allowFullScreen
          ></iframe>
        </div>
      </div>

      <div className='group grid grid-cols-4 gap-4 md:gap-8 mt-8 max-w-3xl mx-auto'>
        {dummyTrailers.map((trailer, index) => (
          <div
            key={index}
            onClick={() => setCurrentTrailer(trailer)}
            className={`relative cursor-pointer hover:-translate-y-1 duration-300 ${
                currentTrailer.videoUrl === trailer.videoUrl ? 'ring-2 ring-white rounded-lg' : ''
            }`}
          >
            <img
              src={trailer.image}
              alt="trailer"
              className='rounded-lg w-full h-full object-cover brightness-75 aspect-video'
            />
            <PlayCircleIcon
              strokeWidth={1.6}
              className='absolute top-1/2 left-1/2 w-8 h-8 transform -translate-x-1/2 -translate-y-1/2 text-white'
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default TrailerSection


