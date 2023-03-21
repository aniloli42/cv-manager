import { FiEye } from "react-icons/fi";
import { handlePercentageFinding } from "../App";

type ErrorCardType = {
  file: string;
};

export default function ErrorCard({ file }: ErrorCardType) {
  const fileName = file.split("/").at(-1);

  return (
    <div className="bg-gray-200 py-1 px-2 rounded grid grid-cols-[auto_max-content] gap-2">
      <h3 className="text-base text-gray-00 break-all">{fileName}</h3>
      <a
        className="[grid-column:2/3] [grid-row:1/3] self-center"
        href={file}
        target="_blank"
      >
        <FiEye />
      </a>
    </div>
  );
}
