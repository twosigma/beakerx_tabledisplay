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

import { CommSignalMessage } from './CommSignalMessage';

export class ContextMenuClickMessage extends CommSignalMessage {
  constructor(row: number, column: number, protected itemKey: string) {
    super('CONTEXT_MENU_CLICK', row, column);
  }

  toObject() {
    return {
      event: this.event,
      row: this.row,
      column: this.col,
      itemKey: this.itemKey,
    };
  }
}
