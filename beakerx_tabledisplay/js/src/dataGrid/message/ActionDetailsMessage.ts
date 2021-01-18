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

export class ActionDetailsMessage extends CommSignalMessage {
  protected actionType: 'DOUBLE_CLICK' | 'CONTEXT_MENU_CLICK';
  protected contextMenuItem: string = null;

  constructor(
    actionType: 'DOUBLE_CLICK' | 'CONTEXT_MENU_CLICK',
    protected row: number,
    protected col: number,
    contextMenuItem?: string,
  ) {
    super('actiondetails', row, col);
    this.actionType = actionType;
    if (actionType === 'CONTEXT_MENU_CLICK') {
      this.contextMenuItem = contextMenuItem;
    }
  }

  toObject() {
    const obj: {
      event: string;
      params: {
        actionType: string;
        row: number;
        col: number;
        contextMenuItem?: string;
      };
    } = {
      event: this.event,
      params: {
        actionType: this.actionType,
        row: this.row,
        col: this.col,
      },
    };

    if (this.actionType === 'CONTEXT_MENU_CLICK') {
      obj.params.contextMenuItem = this.contextMenuItem;
    }

    return obj;
  }
}
