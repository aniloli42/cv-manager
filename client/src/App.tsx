import { useMutation } from "@tanstack/react-query";
import { FormEvent, useMemo, useState } from "react";
import { FiTerminal } from "react-icons/fi";
import { RxCheck, RxCross1, RxReload } from "react-icons/rx";
import { toast, ToastContainer } from "react-toastify";
import Card from "./components/Card";
import ResultCard from "./components/ResultCard";
import { filerCVMutation } from "./services/mutation";

export type Result = { tag: string; no_of_match: number };
export type ResumeType = {
  filePath: string;
  result: Result[];
  pdfText: string;
};

type ResumeTypeWithMatchPercentage = ResumeType & {
  matchPercentage: number;
};

const displayMessage = (message: string) => {
  toast(message, { delay: 5 });
};

export const handlePercentageFinding = (data: Result[]) => {
  const noOfMatch = data.reduce((count: number, currentData: Result) => {
    if (currentData.no_of_match > 0) return (count += 1);
    return count;
  }, 0);

  const noOfTags = data.length;
  const matchPercentage = Math.round((noOfMatch / noOfTags) * 100);

  return matchPercentage;
};

const calculateTotalTagMatch = (resultArr: Result[]): number =>
  resultArr.reduce((previous, currentNumber) => {
    return previous + currentNumber.no_of_match;
  }, 0);

const sortResult = (
  resumeWithMatchPercentage: ResumeTypeWithMatchPercentage[]
) =>
  resumeWithMatchPercentage?.sort(
    (
      resumeA: ResumeTypeWithMatchPercentage,
      resumeB: ResumeTypeWithMatchPercentage
    ) => {
      if (resumeA.matchPercentage > resumeB.matchPercentage) return -1;
      if (resumeA.matchPercentage < resumeB.matchPercentage) return 1;
      if (
        resumeA.matchPercentage === resumeB.matchPercentage &&
        calculateTotalTagMatch(resumeA.result) >
          calculateTotalTagMatch(resumeB.result)
      )
        return -1;

      if (
        resumeA.matchPercentage === resumeB.matchPercentage &&
        calculateTotalTagMatch(resumeA.result) <
          calculateTotalTagMatch(resumeB.result)
      )
        return 1;
      return 0;
    }
  );

function App() {
  const [formTags, setFormTags] = useState<string>("");

  const { mutate, data, isLoading } = useMutation({
    mutationFn: filerCVMutation,
    onSuccess: (data: unknown) => {
      if (data == null || typeof data !== "object") return null;

      if (!("data" in data))
        return displayMessage("data is not found in response");
      if (!Array.isArray(data.data))
        return displayMessage("typeof data is not array");
      if (data.data.length === 0)
        return displayMessage("Pdf not available in the folder");

      displayMessage(`${data.data.length} CV Fetched`);
    },
    onError: (error: unknown) => {
      if (
        error &&
        typeof error === "object" &&
        "message" in error &&
        typeof error.message === "string"
      ) {
        console.error({ error, message: "Error found" });
        displayMessage(error.message);
      } else displayMessage("Something Went Wrong!!!");
      console.error({ error });
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (formTags === "") return;

    const tags = formTags
      .split(",")
      .filter((tag) => {
        if (tag === " ") return false;
        if (tag === "") return false;

        return true;
      })
      .map((tag) => tag.trim());

    mutate({ tags });
  };

  const resumesWithPercentage = data?.data?.map((resume: ResumeType) => {
    const matchPercentage = handlePercentageFinding(resume.result);
    return { ...resume, matchPercentage };
  });

  const successResume = useMemo(() => {
    const filteredResult = resumesWithPercentage?.filter(
      (resume: ResumeTypeWithMatchPercentage) => resume.matchPercentage >= 50
    );

    return sortResult(filteredResult);
  }, [resumesWithPercentage]);

  const failedResume = useMemo(() => {
    const filteredResult = resumesWithPercentage?.filter(
      (resume: ResumeTypeWithMatchPercentage) => resume.matchPercentage < 50
    );

    return sortResult(filteredResult);
  }, [resumesWithPercentage]);

  return (
    <>
      <ToastContainer hideProgressBar pauseOnFocusLoss />
      {isLoading && (
        <div className="fixed inset-0 z-50 bg-slate-600/20 flex justify-center pt-10">
          <div className="bg-white h-max p-4 rounded-md flex flex-col items-center gap-3">
            <div className="animate-spin text-xl">
              <RxReload />
            </div>
            <p>Data is Fetching...</p>
          </div>
        </div>
      )}
      <div className="py-4 sm:py-10 sm:px-4 px-2 flex flex-col gap-2 sm:gap-5 ">
        {/* Card 1 */}
        <div className="max-w-[24rem]  sm:min-w-[24rem] min-w-full sm:mx-auto">
          <Card
            title="Check CV Matching"
            caption=" Paste PDFs in uploads before test"
            icon={<FiTerminal />}
            iconBgColor="bg-gray-300"
          >
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col gap-2.5">
                <label className="text-gray-600 text-sm">
                  Keywords / Skills
                </label>
                <textarea
                  className="border-b-gray-400 border-b-2 py-1 px-3 resize-none"
                  value={formTags}
                  name="tags"
                  autoComplete="off"
                  autoCapitalize="off"
                  inputMode="text"
                  onChange={(e) => setFormTags(e.target.value.trimStart())}
                />
              </div>

              <button
                disabled={isLoading}
                type="submit"
                className="bg-gray-200 py-2 px-3 rounded-sm text-gray-700 mt-4 w-full disabled:cursor-not-allowed disabled:bg-red-200"
              >
                Filter Resume
              </button>
            </form>
          </Card>
        </div>
        {/* Card 1 End */}

        <div className="grid sm:grid-cols-[repeat(auto-fit,minmax(27rem,32rem))] gap-5 justify-center items-start">
          {((successResume && successResume.length !== 0) ||
            (failedResume && failedResume.length !== 0)) && (
            <>
              {/* Pass Result Card */}

              <Card
                title={`${successResume.length} Passed Resume`}
                icon={<RxCheck className="text-2xl text-white" />}
                iconBgColor="bg-green-400"
                isMinHeightEnable
                isMaxHeightEnable
              >
                {successResume?.map((resume: ResumeType, index: number) => (
                  <ResultCard key={index} {...resume} />
                ))}
              </Card>

              {/* Failed Result Card */}
              <Card
                title={`${failedResume.length} Failed Resume`}
                icon={<RxCross1 className="text-2xl text-white" />}
                iconBgColor="bg-red-400"
                isMinHeightEnable
                isMaxHeightEnable
              >
                {failedResume?.map((resume: ResumeType, index: number) => (
                  <ResultCard key={index} {...resume} />
                ))}
              </Card>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
