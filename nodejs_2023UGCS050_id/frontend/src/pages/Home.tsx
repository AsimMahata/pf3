import { useEffect } from 'react';
import axios from 'axios';

type Props = {}


const Home = (_props: Props) => {
  useEffect(() => {
    axios.get("/api/testing")
      .then((res) => {
        console.log("Response from backend:", res.data);
      })
      .catch((err) => {
        console.error("Error:", err);
      });
  }, []);
  return (
    <div>Hello Guys</div>
  )
}

export default Home
