'use client';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/api/axios';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface EntityCategorySelectProps {
  kind: 'article' | 'service';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function EntityCategorySelect({
  kind,
  value,
  onChange,
  placeholder = 'Select category',
}: EntityCategorySelectProps) {
  const endpoint = kind === 'article' ? '/categories/' : '/service-categories/';
  const { data } = useQuery({
    queryKey: [kind === 'article' ? 'categories' : 'service-categories'],
    queryFn: async () => {
      const res = await axiosInstance.get(endpoint);
      return res.data?.results ?? res.data ?? [];
    },
  });

  const categories = Array.isArray(data) ? data : [];

  return (
    <Select
      value={value || '__none__'}
      onValueChange={(next) => onChange(!next || next === '__none__' ? '' : next)}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">—</SelectItem>
        {categories.map((category: { id: string; title: string }) => (
          <SelectItem key={category.id} value={category.id}>
            {category.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
