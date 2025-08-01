import { useParams } from "react-router-dom";
import ModifyComponent from "../../components/donation/ModifyComponent";

const ModifyPage = () => {
  const { tno } = useParams();

  return (
    <div className="p-4 w-full bg-white">
      <ModifyComponent tno={tno} />
    </div>
  );
};

export default ModifyPage;
