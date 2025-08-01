import { useParams } from "react-router-dom";
import ReadComponent from "../../components/donation/ReadComponent";

const ReadPage = () => {
  const { tno } = useParams();

  return (
    <div>
      <ReadComponent tno={tno}></ReadComponent>
    </div>
  );
};

export default ReadPage;
