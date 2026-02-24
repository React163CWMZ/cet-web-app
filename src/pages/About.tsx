import { useLocation } from "react-router-dom";

const About = () => {
  // const navigate = useNavigate();
  const location = useLocation();

  return (
    <div style={{ padding: "20px" }}>
      <h1>About</h1>
      <p>当前路径: {location.pathname}</p>
    </div>
  );
};

export default About;
