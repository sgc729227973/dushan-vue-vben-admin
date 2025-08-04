interface VerificationProps {
  arith?: number;
  barSize?: {
    height: string;
    width: string;
  };
  blockSize?: {
    height: string;
    width: string;
  };
  captchaType?:
    | 'aliyuncaptcha'
    | 'blockPuzzle'
    | 'clickWord'
    | 'recaptcha'
    | 'tjcaptcha';
  explain?: string;
  figure?: number;
  imgSize?: {
    height: string;
    width: string;
  };
  mode?: 'fixed' | 'pop';
  space?: number;
  type?: '1' | '2';
  checkCaptchaApi?: (data: any) => Promise<any>;
  getCaptchaApi?: (data: any) => Promise<any>;
  // 谷歌验证码配置
  siteKey?: string;
  size?: 'compact' | 'invisible' | 'normal';
  theme?: 'dark' | 'light';
}

export type { VerificationProps };
