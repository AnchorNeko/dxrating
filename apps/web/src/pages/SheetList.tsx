import { Alert, Button, TextField } from "@mui/material";
import { FC, useContext, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import IconMdiOcr from "~icons/mdi/ocr";
import { SheetListContainer } from "../components/sheet/SheetListContainer";
import {
  SheetSortFilter,
  SheetSortFilterForm,
} from "../components/sheet/SheetSortFilter";
import {
  SheetDetailsContext,
  SheetDetailsContextProvider,
} from "../models/context/SheetDetailsContext";
import { FlattenedSheet, useFilteredSheets, useSheets } from "../songs";
import { DXRatingPlugin } from "../utils/capacitor/plugin/wrap";
import { isBuildPlatformApp } from "../utils/env";

const chainEvery =
  <T,>(...fns: ((arg: T) => boolean | undefined)[]) =>
  (arg: T) =>
    fns.every((fn) => fn(arg));

const skeletonWidths = Array.from({ length: 20 }).map(
  () => Math.random() * 6.0 + 5.5,
);

const SheetListInner: FC = () => {
  const { t } = useTranslation(["sheet"]);
  const { data: sheets, isLoading } = useSheets();
  const { setQueryActive } = useContext(SheetDetailsContext);
  const [query, setQuery] = useState("");
  const { results, elapsed: searchElapsed } = useFilteredSheets(query);
  const [sortFilterOptions, setSortFilterOptions] =
    useState<SheetSortFilterForm | null>(null);

  const { filteredResults, elapsed: filteringElapsed } = useMemo(() => {
    const startTime = performance.now();
    let sortFilteredResults: FlattenedSheet[] = results;
    if (sortFilterOptions) {
      sortFilteredResults = results.filter((sheet) => {
        return chainEvery<FlattenedSheet>(
          (v) => {
            if (sortFilterOptions.filters.internalLevelValue) {
              const { min, max } = sortFilterOptions.filters.internalLevelValue;
              return v.internalLevelValue >= min && v.internalLevelValue <= max;
            } else {
              return true;
            }
          },
          (v) => {
            if (sortFilterOptions.filters.versions) {
              const versions = sortFilterOptions.filters.versions;
              return versions.includes(v.version);
            } else {
              return true;
            }
          },
          (v) => {
            if (sortFilterOptions.filters.tags.length) {
              const tags = sortFilterOptions.filters.tags;
              return tags.every((tag) => v.tags.includes(tag));
            } else {
              return true;
            }
          },
        )(sheet);
      });
      if (!query) {
        sortFilteredResults.sort((a, b) => {
          return sortFilterOptions.sorts.reduce((acc, sort) => {
            if (acc !== 0) {
              return acc;
            }
            const aValue = a[sort.descriptor];
            const bValue = b[sort.descriptor];
            if (aValue == null || bValue == null) {
              // ==: null or undefined
              return 0;
            }
            if (aValue < bValue) {
              return sort.direction === "asc" ? -1 : 1;
            }
            if (aValue > bValue) {
              return sort.direction === "asc" ? 1 : -1;
            }
            return 0;
          }, 0);
        });
      }
    }
    return {
      filteredResults: sortFilteredResults,
      elapsed: performance.now() - startTime,
    };
  }, [results, sortFilterOptions, query]);

  return (
    <div className="flex-container pb-global">
      <TextField
        label={t("sheet:search")}
        variant="outlined"
        value={query}
        fullWidth
        onChange={(e) => {
          setQuery(e.target.value);
          setQueryActive(!!e.target.value);
        }}
      />

      {isBuildPlatformApp && (
        <Button
          onClick={() => DXRatingPlugin.launchInstantOCR()}
          className="mt-2 rounded-full"
          variant="contained"
          startIcon={<IconMdiOcr />}
        >
          {t("sheet:ocr")}
        </Button>
      )}

      <SheetSortFilter onChange={(v) => setSortFilterOptions(v)} />

      <Alert severity="info" className="text-sm !rounded-full shadow-lg">
        {t("sheet:search-summary", {
          found: isLoading ? "..." : filteredResults.length,
          total: isLoading ? "..." : sheets?.length,
          elapsed: (searchElapsed + filteringElapsed).toFixed(1),
        })}
      </Alert>

      {isLoading ? (
        <div className="flex flex-col w-full">
          {skeletonWidths.map((width, i) => (
            <div
              className="animate-pulse flex items-center justify-start gap-4 w-full h-[78px] px-5 py-2"
              key={i}
              style={{
                animationDelay: `${i * 40}ms`,
              }}
            >
              <div className="h-12 w-12 min-w-[3rem] min-h-[3rem] rounded bg-slate-6/50"></div>
              <div className="flex flex-col gap-1">
                <div
                  className="bg-slate-5/50 h-5 mb-1"
                  style={{ width: `${width}rem` }}
                >
                  &nbsp;
                </div>
                <div className="w-24 bg-slate-3/50 h-3">&nbsp;</div>
              </div>

              <div className="flex-1" />
              <div className="w-10 bg-slate-5/50 h-6 mr-2">&nbsp;</div>
            </div>
          ))}
        </div>
      ) : (
        <SheetListContainer sheets={filteredResults} />
      )}
    </div>
  );
};

export const SheetList: FC = () => {
  return (
    <SheetDetailsContextProvider>
      <SheetListInner />
    </SheetDetailsContextProvider>
  );
};
