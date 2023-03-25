import { FiEye } from "react-icons/fi";
import { Result, ResumeType, handlePercentageFinding } from "../App";
import Tag from "./Tag";

type ResultCardType = ResumeType & {};

export default function ResultCard({
  filePath,
  result,
  pdfText,
}: ResultCardType) {
  const fileName = filePath.split("/").at(-1);

  return (
    <div className="bg-gray-200 py-1 px-2 rounded grid grid-cols-[auto_max-content] gap-2">
      <h3 className="text-base text-gray-00 break-all">{fileName}</h3>

      <a
        className="[grid-column:2/3] [grid-row:1/3] self-center"
        href={filePath}
        target="_blank"
      >
        <FiEye />
      </a>
      <div className="flex gap-1 flex-wrap my-1 items-center">
        <h4 className="text-sm text-gray-500 ">
          {handlePercentageFinding(result)}% matched:
        </h4>
        {result?.map((resultItem, index) => (
          <Tag key={index} {...resultItem} />
        ))}
      </div>
    </div>
  );
}
