/*
 *  Copyright 2017 TWO SIGMA OPEN SOURCE, LLC
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

import moment from 'moment-timezone';

export class CommonUtils {
  public static formatTimestamp(timestamp: number, tz: string, format: string): string {
    return CommonUtils.applyTimezone(timestamp, tz).format(format);
  }

  public static generateId(length = 6): string {
    return CommonUtils.randomString(length);
  }

  public static rgbaToHex(r: number, g: number, b: number, a = 0xff): string {
    let num = ((a & 0xff) << 24) | ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff);
    if (num < 0) {
      num = 0xffffffff + num + 1;
    }

    return `#${num.toString(16).padStart(8, '0').slice(2)}`;
  }

  private static applyTimezone(timestamp: number, tz?: string): moment.Moment {
    const time = moment(timestamp);
    if (!tz) {
      return time;
    }
    if (tz.startsWith('GMT')) {
      time.utcOffset(tz);
      return time;
    }

    time.tz(tz);
    return time;
  }

  private static randomString(length = 6): string {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const textArray: string[] = [];

    for (let i = 0; i < length; i++) {
      textArray.push(possible.charAt(Math.floor(Math.random() * possible.length)));
    }

    return textArray.join('');
  }
}
