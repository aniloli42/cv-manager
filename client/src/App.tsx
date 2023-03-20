import { useMutation } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { FiUpload } from "react-icons/fi";
import { RxCheck, RxCross1 } from "react-icons/rx";
import ResultCard from "./components/ResultCard";
import { filerCVQuery } from "./services/mutation";

export type T = { tag: string; no_of_match: number };
export type ResumeType = { file: string; result: T[] };

export const handlePercentageFinding = (data: T[]) => {
  const noOfMatch = data.reduce((count: number, currentData: T) => {
    if (currentData.no_of_match > 0) return (count += 1);

    return count;
  }, 0);

  const noOfTags = data.length;
  const matchPercentage = parseFloat(((noOfMatch / noOfTags) * 100).toFixed(2));

  return matchPercentage;
};

function App() {
  const [formData, setFormData] = useState({ filePath: "", tags: "" });

  const { mutate, data, isError, isLoading } = useMutation({
    mutationFn: filerCVQuery,
  });

  const handleChange = (e: FormEvent) => {
    setFormData((prevData) => ({
      ...prevData,
      [(e.target as HTMLInputElement).name]: (e.target as HTMLInputElement)
        .value,
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (formData.filePath === "" || formData.tags === "") return;

    const tags = formData.tags.split(",");
    mutate({ filePath: formData.filePath, tags });
  };

  const successResume = data?.data.filter((resume: ResumeType) => {
    const matchPercentage = handlePercentageFinding(resume.result);
    if (matchPercentage >= 50) return true;
  });

  const failedResume = data?.data.filter((resume: ResumeType) => {
    const matchPercentage = handlePercentageFinding(resume.result);
    if (matchPercentage < 50) return true;
  });

  return (
    <div className="py-4 sm:py-10 sm:px-4 px-2 flex flex-col gap-2 sm:gap-5 ">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(21rem,24rem))] gap-5 justify-center">
        {/* Card 1 */}
        <form
          className="bg-gray-50 py-8 px-6 flex flex-col gap-5 rounded-lg self-start"
          onSubmit={handleSubmit}
        >
          <div className="flex gap-5 items-center">
            <div className="bg-gray-300 w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center">
              <FiUpload />
            </div>

            <h1 className="text-lg leading-4 text-gray-700">
              Paste Resume Folder
              <span className="flex text-base underline">or single resume</span>
            </h1>
          </div>

          <div className="flex flex-col gap-2.5">
            <label className="text-gray-600 text-sm">Enter Path</label>
            <input
              type="text"
              className="border-b-gray-400 border-b-2 py-1 px-3"
              value={formData.filePath}
              name="filePath"
              onChange={handleChange}
            />
          </div>
          <div className="flex flex-col gap-2.5">
            <label className="text-gray-600 text-sm">Keywords / Skills</label>
            <input
              type="text"
              className="border-b-gray-400 border-b-2 py-1 px-3"
              value={formData.tags}
              name="tags"
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            className="bg-gray-200 py-2 px-3 rounded-sm text-gray-700"
          >
            Filter Resume
          </button>
        </form>
        {/* Card 1 End */}

        {/* Pass Result Card */}
        <div className="sm:min-w-[20rem] bg-gray-50 py-8 px-6 rounded-lg min-h-[21rem]">
          <div className="flex gap-5 items-center">
            <div className="bg-green-400 w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center">
              <RxCheck className="text-2xl text-white" />
            </div>

            <h2 className=" leading-4 text-base text-gray-700">
              Passed Resume
              <span className="flex text-sm underline">
                100% Accuracy not guaranteed
              </span>
            </h2>
          </div>
          <div className="my-2 flex flex-col gap-2">
            {successResume?.map((resume: ResumeType, index: number) => (
              <ResultCard
                key={index}
                file={resume.file}
                result={resume.result}
              />
            ))}
          </div>
        </div>

        {/* Failed Result Card */}
        <div className="sm:min-w-[20rem] bg-gray-50 py-8 px-6 rounded-lg min-h-[21rem]">
          <div className="flex gap-5 items-center">
            <div className="bg-red-400 w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center">
              <RxCross1 className="text-white text-xl" />
            </div>

            <h2 className="text-base leading-4 text-gray-700">
              Failed Resume
              <span className="flex text-sm underline">
                100% Accuracy not guaranteed
              </span>
            </h2>
          </div>
          <div className="my-2 flex flex-col gap-2">
            {failedResume?.map((resume: ResumeType, index: number) => (
              <ResultCard
                key={index}
                file={resume.file}
                result={resume.result}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
