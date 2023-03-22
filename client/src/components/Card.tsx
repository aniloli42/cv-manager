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
      className={` bg-gray-50 rounded-lg overflow-hidden
      
      `}
    >
      <div className="flex gap-4 items-center py-4 px-5 bg-gray-50 border-b">
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
      <div
        className={`overflow-auto px-4 py-2 
        ${isMaxHeightEnable && "max-h-[21rem]"}
        ${isMinHeightEnable ? "min-h-[21rem]" : "min-h-max"}
      `}
      >
        <div className="my-2 flex flex-col gap-2">{children}</div>
      </div>
    </div>
  );
};

export default Card;
