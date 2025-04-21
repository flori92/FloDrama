import React from 'react';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, poster, title }) => {
  return (
    <div className="w-full flex flex-col items-center my-4">
      <video
        className="w-full max-w-3xl rounded-xl shadow-lg bg-black"
        src={src}
        poster={poster}
        controls
        controlsList="nodownload"
        preload="auto"
        style={{ aspectRatio: '16/9' }}
        title={title}
      >
        Sorry, your browser doesn't support embedded videos.
      </video>
    </div>
  );
};

export default VideoPlayer;
