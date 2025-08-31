import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { NewsItem } from '../types';

interface UseCategoryFilterReturn {
    selectedCategory: string | null;
    setSelectedCategory: (category: string | null) => void;
    filteredArticles: NewsItem[];
    articleCounts: Record<string, number>;
    availableCategories: string[];
}

/**
 * Custom hook for managing category filtering with URL parameter synchronization
 */
export function useCategoryFilter(articles: NewsItem[]): UseCategoryFilterReturn {
    const router = useRouter();
    const [selectedCategory, setSelectedCategoryState] = useState<string | null>(null);

    // Initialize category from URL parameter
    useEffect(() => {
        const categoryFromUrl = router.query.category as string;
        if (categoryFromUrl && categoryFromUrl !== selectedCategory) {
            setSelectedCategoryState(categoryFromUrl);
        } else if (!categoryFromUrl && selectedCategory) {
            setSelectedCategoryState(null);
        }
    }, [router.query.category]);

    // Update URL when category changes
    const setSelectedCategory = useCallback((category: string | null) => {
        setSelectedCategoryState(category);

        // Update URL without causing a page reload
        const currentQuery = { ...router.query };
        if (category) {
            currentQuery.category = category;
        } else {
            delete currentQuery.category;
        }

        router.push(
            {
                pathname: router.pathname,
                query: currentQuery,
            },
            undefined,
            { shallow: true }
        );
    }, [router]);

    // Calculate available categories from articles
    const availableCategories = Array.from(
        new Set(articles.map(article => article.category))
    ).sort();

    // Filter articles by selected category
    const filteredArticles = selectedCategory
        ? articles.filter(article => article.category === selectedCategory)
        : articles;

    // Calculate article counts per category
    const articleCounts = articles.reduce((counts, article) => {
        counts[article.category] = (counts[article.category] || 0) + 1;
        return counts;
    }, {} as Record<string, number>);

    // Add total count
    articleCounts['all'] = articles.length;

    return {
        selectedCategory,
        setSelectedCategory,
        filteredArticles,
        articleCounts,
        availableCategories,
    };
}