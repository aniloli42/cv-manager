import { ReactNode } from "react";
import { RxCheck } from "react-icons/rx";

type CardPropsType = {
  children: ReactNode;
  title: string;
  caption?: string;
  icon: ReactNode;
  iconBgColor?: string;
  isMinHeightEnable?: boolean;
  isMaxHeightEnable?: boolean;
};

const Card = ({
  children,
  title,
  caption,
  icon,
  iconBgColor = "bg-gray-200",
  isMinHeightEnable,
  isMaxHeightEnable,
}: CardPropsType) => {
  return (
    <div
      className={`sm:min-w-[20rem] bg-gray-50 px-5 rounded-lg  pb-2  overflow-auto
      ${isMaxHeightEnable && "max-h-[27rem]"}
      ${isMinHeightEnable ? "min-h-[21rem]" : "min-h-max"}
      `}
    >
      <div className="flex gap-5 items-center py-5  sticky top-0 bg-gray-50">
        <div
          className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center ${
            iconBgColor ?? ""
          }`}
        >
          {icon}
        </div>

        <h2 className="leading-4 text-base text-gray-700 ">
          {title}
          <span className="flex text-sm underline">
            {caption ?? "100% Accuracy not guaranteed"}
          </span>
        </h2>
      </div>
      <div className="my-2 flex flex-col gap-2">{children}</div>
    </div>
  );
};

export default Card;
