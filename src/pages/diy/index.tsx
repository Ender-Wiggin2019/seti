import { GetStaticProps, InferGetStaticPropsType } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import * as React from 'react';
import { RiAlarmWarningFill } from 'react-icons/ri';

import Layout from '@/components/layout/Layout';
import ArrowLink from '@/components/links/ArrowLink';
import Seo from '@/components/Seo';

export default function NotFoundPage(
  _props: InferGetStaticPropsType<typeof getStaticProps>
) {
  return (
    <Layout>
      <Seo templateTitle='Not Found' />

      <main>
        <section className='bg-white/0'>
          <div className='layout flex min-h-screen flex-col items-center justify-center text-center text-black'>
            <RiAlarmWarningFill
              size={60}
              className='drop-shadow-glow animate-flicker text-red-500'
            />
            <h1 className='mt-8 text-4xl md:text-6xl'>Page Not Found</h1>
            <ArrowLink className='mt-4 md:text-lg' href='/'>
              Back to Home
            </ArrowLink>
          </div>
        </section>
      </main>
    </Layout>
  );
}

type Props = {
  // Add custom props here
};

export const getStaticProps: GetStaticProps<Props> = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'])),
  },
});

// import { toPng } from 'html-to-image';
// import { debounce } from 'lodash';
// import { GetStaticProps, InferGetStaticPropsType } from 'next';
// import { useTranslation } from 'next-i18next';
// import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
// import * as React from 'react';
// import { useEffect, useState } from 'react';

// import { BaseCard } from '@/components/cards/base_cards/BaseCard';
// import { BaseCardForm } from '@/components/forms/BaseCardForm';
// import Layout from '@/components/layout/Layout';
// import Seo from '@/components/Seo';
// import { Button } from '@/components/ui/button';
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from '@/components/ui/card';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';

// import BaseCard, { BaseCardSchema, BaseCardSchemaDto } from '@/types/BaseCard';
// import { CardSource } from '@/types/CardSource';
// import { Ability } from '@/types/KeyWords';
// import { SpecialEnclosure } from '@/types/SpecialEnclosure';

// export default function Page(
//   _props: InferGetStaticPropsType<typeof getStaticProps>
// ) {
//   const { t } = useTranslation('common');
//   const downloadRef = React.useRef<HTMLDivElement>(null);
//   const initialDiyBaseCard = {
//     id: 'FAN',
//     name: '',
//     latinName: '',
//     // image:
//     //   'https://ender-picgo.oss-cn-shenzhen.aliyuncs.com/img/CleanShot%202023-08-13%20at%2021.54.00.png',
//     size: 1,
//     rock: 0,
//     water: 0,
//     price: 0,
//     requirements: [],
//     tags: [],
//     specialEnclosures: [],
//     abilities: [],
//     description: '',
//     reefDwellerEffect: [],
//     soloEffect: [],
//     reputation: 0,
//     appeal: 0,
//     conservationPoint: 0,
//     wave: false,
//     canBeInStandardEnclosure: true,
//     source: CardSource.FAN_MADE,
//   } as BaseCardSchemaDto;

//   const [isResetting, setIsResetting] = useState(false);
//   const [diyBaseCard, setDiyBaseCard] = useState(initialDiyBaseCard);
//   useEffect(() => {
//     if (isResetting) {
//       setIsResetting(false);
//     }
//   }, [isResetting]);
//   const handleDownloadImage = async () => {
//     if (downloadRef.current === null) {
//       return;
//     }

//     toPng(downloadRef.current, { quality: 0.8, pixelRatio: 7 })
//       .then((dataUrl) => {
//         const link = document.createElement('a');
//         link.download = diyBaseCard.name + '.png';
//         link.href = dataUrl;
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);
//       })
//       .catch((err) => {
//         console.log(err);
//       });
//   };

//   const valuesToBaseCard = (values: BaseCardSchemaDto): BaseCard => {
//     const transformedValues = {
//       ...values,
//       specialEnclosures: values.specialEnclosures?.map((se) =>
//         SpecialEnclosure.fromObject(se)
//       ),
//       abilities: values.abilities?.map((ability) =>
//         Ability.fromObject(ability)
//       ),
//       reefDwellerEffect: values.reefDwellerEffect?.map((effect) =>
//         Ability.fromObject(effect)
//       ),
//       // ... add any other properties that need transformation here ...
//     };

//     return transformedValues as BaseCard;
//   };

//   const handleValuesChange = (values: BaseCardSchemaDto) => {
//     // const animalCard = valuesToBaseCard(values);
//     setDiyBaseCard(values);
//     // console.log(animalCard);  // 这里可以实时获取到转换后的BaseCard对象
//   };
//   const handleJsonImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const fileReader = new FileReader();
//     if (!e.target.files) {
//       return;
//     }
//     fileReader.readAsText(e.target.files[0], 'UTF-8');
//     fileReader.onload = (event) => {
//       if (!event.target) {
//         return;
//       }
//       try {
//         const parsedData = JSON.parse(event.target.result as string);

//         // Validate against the BaseCardSchema
//         const result = BaseCardSchema.safeParse(parsedData);
//         if (!result.success) {
//           alert(
//             'The parsed JSON does not match the expected Animal Card structure.'
//           );
//           return;
//         }

//         setDiyBaseCard(parsedData);
//         setIsResetting(true);
//       } catch (error) {
//         alert("Failed to parse the JSON. Please ensure it's a valid JSON.");
//       }
//     };
//   };

//   const debouncedHandleValuesChange = debounce(handleValuesChange, 300);

//   return (
//     <Layout>
//       <Seo templateTitle='Seti Card Maker' />
//       <section className='bg-white/0'>
//         <div className='mt-10 flex min-h-screen flex-col items-center justify-center gap-10 text-start text-black md:flex-row md:items-start md:gap-20'>
//           <div className='scale-125 py-8 md:mt-2 xl:mr-5 xl:mt-12 xl:scale-150'>
//             <div ref={downloadRef} className=''>
//               <BaseCard animal={valuesToBaseCard(diyBaseCard)} />
//             </div>
//           </div>
//           <Card className='w-[370px] bg-white/75'>
//             <CardHeader>
//               <CardTitle>{t('diy.card_maker')}</CardTitle>
//               <CardDescription>
//                 {t('diy.create_your_own_animal_card')}
//               </CardDescription>
//             </CardHeader>
//             <CardContent>
//               <BaseCardForm
//                 defaultValues={diyBaseCard}
//                 onValuesChange={debouncedHandleValuesChange}
//                 isResetting={isResetting}
//               />
//             </CardContent>
//             <CardFooter className='flex flex-col justify-start gap-4'>
//               <div className='grid w-full max-w-sm items-center gap-1.5'>
//                 <Label htmlFor='animal-json-import'>
//                   {t('diy.import_json')}
//                 </Label>
//                 <Input
//                   id='animal-json-import'
//                   type='file'
//                   value=''
//                   className=''
//                   onChange={handleJsonImport}
//                 />
//               </div>
//               {/*<Button variant="outline">*/}
//               {/*  {t('diy.import_json')}*/}
//               {/*</Button>*/}
//               <Button
//                 className='w-36 bg-primary-500 hover:bg-primary-400'
//                 onClick={handleDownloadImage}
//               >
//                 {t('diy.Download')}
//               </Button>
//             </CardFooter>
//           </Card>
//         </div>
//       </section>
//     </Layout>
//   );
// }

// type Props = {
//   // Add custom props here
// };

// export const getStaticProps: GetStaticProps<Props> = async ({ locale }) => ({
//   props: {
//     ...(await serverSideTranslations(locale ?? 'en', ['common'])),
//   },
// });
