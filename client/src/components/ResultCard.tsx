import { FiEye } from "react-icons/fi";
import { T, ResumeType, handlePercentageFinding } from "../App";

type ResultCardType = ResumeType & {};

export default function ResultCard({ file, result }: ResultCardType) {
  const fileName = file.split("/").at(-1);

  return (
    <div className="bg-gray-200 py-1 px-2 rounded grid grid-cols-[auto_max-content]">
      <h3 className="text-base text-gray-00">{fileName}</h3>
      <p className="text-sm text-gray-500 ">
        {handlePercentageFinding(result)}% matched
      </p>
      <button
        className="[grid-column:2/3] [grid-row:1/3]"
        type="button"
        onClick={() => {
          if (window == null) return;
          window?.open(
            "file:///home/whoami/Downloads/UNK%20financial.affidavit%202023.pdf",
            "_blank"
          );
        }}
      >
        <FiEye />
      </button>
    </div>
  );
}
