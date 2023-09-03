import { useEffect,useContext } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "./UserContext";

export default function Header()
{
  const { setUserInfo ,userInfo } = useContext(UserContext);
  useEffect(()=>{
    fetch('http://localhost:4040/profile', {
      credentials:'include',
      headers:{'Content-Type':'application/json'},
    }).then(response=>{
      response.json().then(userInfo=>{
         setUserInfo(userInfo);
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  function logout()
  {
    fetch('http://localhost:4040/logout',{
      credentials:'include',
      method:'POST',
    });
    setUserInfo(null);
  }

const username=userInfo?.username;

  return(
       <header>
          <a href=" " className="logo">MyBlog</a>
          <nav>
            {username && (
              <>
                <Link to="/create">Create new post</Link>
                <a href="#" onClick={ logout }>LogOut</a>
              </>
            )}
            {!username && (
              <>
                <Link to="/login">Login</Link>
                <Link to="/register">Register</Link>
              </>
            )}
          </nav>
        </header>
     
    )
}