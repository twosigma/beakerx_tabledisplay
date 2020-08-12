/*
 *  Copyright 2018 TWO SIGMA OPEN SOURCE, LLC
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

export class ColumnValuesIterator {
  public static longestString(valueResolver: (item: any) => string | undefined) {
    return (a: any, b: any) => {
      const value1 = valueResolver(a);
      const value2 = valueResolver(b);
      const aLength = value1 ? value1.length : 0;
      const bLength = value2 ? value2.length : 0;

      if (aLength === bLength) {
        return 0;
      }

      return aLength < bLength ? -1 : 1;
    };
  }

  public static minMax(valueResolver: (item: any) => number) {
    return (a: any, b: any) => {
      const value1 = valueResolver(a);
      const value2 = valueResolver(b);

      if (value1 === value2) {
        return 0;
      }

      return value1 < value2 ? -1 : 1;
    };
  }
}
