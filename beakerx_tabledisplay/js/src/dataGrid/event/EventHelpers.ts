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

export class EventHelpers {
  public static isOutsideNode(event: MouseEvent, node: HTMLElement): boolean {
    const rect = node.getBoundingClientRect();

    if (event.clientY - rect.top <= 1) {
      return true;
    }

    if (rect.bottom - event.clientY <= 1) {
      return true;
    }

    if (event.clientX - rect.left <= 1) {
      return true;
    }

    if (rect.right - event.clientX <= 1) {
      return true;
    }

    return false;
  }

  public static isInsideGrid(event): boolean {
    const relatedTarget = (event.relatedTarget || event.target) as HTMLElement;

    if (!relatedTarget) {
      return false;
    }

    if (relatedTarget.classList.contains('p-DataGrid')) {
      return true;
    }

    if (relatedTarget.closest('.p-DataGrid')) {
      return true;
    }

    return false;
  }

  public static isInsideGridNode(event: MouseEvent, gridNode: HTMLElement): boolean {
    const relatedTarget = (event.relatedTarget || event.target) as HTMLElement;

    if (!relatedTarget) {
      return false;
    }

    if (gridNode.contains(relatedTarget)) {
      return true;
    }

    if (relatedTarget === gridNode) {
      return true;
    }

    if (relatedTarget.classList.contains('bko-menu')) {
      return true;
    }

    if (relatedTarget.closest('.bko-table-menu')) {
      return true;
    }
    return false;
  }
}
