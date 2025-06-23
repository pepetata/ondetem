import { useEffect } from "react";

const Home = () => {
  useEffect(() => {
    document.title = "Onde Tem?";
  }, []);

  return <div></div>;
};
export default Home;
