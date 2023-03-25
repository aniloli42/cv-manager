import { Result } from "../App";

type TagProps = Result & {};

const Tag = ({ no_of_match, tag }: TagProps) => {
  return (
    <div className="flex bg-gray-600 rounded w-max overflow-hidden ">
      <p className="text-gray-100 text-xs px-2 py-0.5">{tag}</p>
      <p className="bg-gray-100 text-xs py-0.5 px-2">{no_of_match}</p>
    </div>
  );
};

export default Tag;
