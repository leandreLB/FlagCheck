export type RedFlag = {
    flag: string;
    description: string;
  };
  
  export type ScanRecord = {
    id: string;
    user_id: string;
    image_url: string;
    red_flags: RedFlag[];
    score: number;
    created_at: string;
  };