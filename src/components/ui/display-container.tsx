/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-04 00:26:01
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-04 00:38:03
 * @Description:
 */

type Props = {
  header: string;
  children: React.ReactNode;
};

export const DisplayContainer: React.FC<Props> = ({ header, children }) => {
  return (
    <div className='flex justify-between items-center text-primary-500 gap-2'>
      <h2 className='text-lg text-primary-200 font-bold'>{header}</h2>
      <>{children}</>
    </div>
  );
};
