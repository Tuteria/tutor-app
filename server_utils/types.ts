export type TuteriaSubjectType = {
  pk?: number;
  slug: string;
  name: string;
  pass_mark: number;
  subjects: Array<{
    name: string;
    url: string;
    test_name: string;
    pass_mark: number;
  }>;
  category?: string;
  subcategory?: string;
  duration?: number
};
