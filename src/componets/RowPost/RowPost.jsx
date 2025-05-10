import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../Context/UserContext";
import { imageUrl } from "../../Constants/Constance";

function RowPost(props) {
  const [isHover, setIsHover] = useState(false);
  const { User } = useContext(AuthContext);
  const [windowSize, setWindowSize] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="row_post">
      <h2 className="text-white font-medium md:text-xl pl-12 pt-4">
        {props.title}
      </h2>
      <div className="flex overflow-x-scroll pl-12 py-4 scrollbar-hide">
        {props.movies &&
          props.movies.map((obj, index) => {
            if (!obj || typeof obj !== 'object') return null;
            return (
              <div
                key={obj.id || index}
                className="flex-shrink-0 mr-4 relative"
                onMouseEnter={() => setIsHover(true)}
                onMouseLeave={() => setIsHover(false)}
              >
                <Link to={obj.id ? `/play/${obj.id}` : '#'}>
                  <img
                    className="w-40 h-60 object-cover rounded-md cursor-pointer transition-transform duration-300 hover:scale-105"
                    src={obj.poster_path ? `${imageUrl}${obj.poster_path}` : '/assets/poster-placeholder.jpg'}
                    alt={obj.title || obj.name || 'Film'}
                  />
                </Link>
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black to-transparent">
                  <h3 className="text-white text-sm font-medium truncate">
                    {obj.title || obj.name || 'Film sans titre'}
                  </h3>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

export default RowPost;
