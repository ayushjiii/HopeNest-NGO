import React from 'react';

const Video = () => {
  return (
    <div className="relative bg-white py-10 flex justify-center items-center">
      {/* Video Frame with Purple Border */}
      <div className="max-w-7xl w-[90%] md:p-[70px]">
        <video
          className="w-full h-auto rounded-[12px]"
          controls
          poster="./src/assets/img/more.png" // optional preview image
        >
          <source src="./src/assets/img/ngo2.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* OR Use YouTube iframe instead */}

        {/* 
        <iframe
          className="w-full aspect-video"
          src="https://www.youtube.com/embed/dQw4w9WgXcQ"
          title="Video Player"
          frameBorder="0"
          allow="autoplay; encrypted-media"
          allowFullScreen
        ></iframe> 
        */}
        
      </div>
    </div>
  );
};

export default Video;

