/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import '../../../test/common-test-setup-karma';
import {
  createElementDiff,
  formatText,
  createTabWrapper,
  diffClasses,
} from './gr-diff-utils';

const LINE_BREAK_HTML = '<span class="style-scope gr-diff br"></span>';

suite('gr-diff-utils tests', () => {
  suite('legacy rendering', () => {
    test('createElementDiff classStr applies all classes', () => {
      const node = createElementDiff('div', 'test classes');
      assert.isTrue(node.classList.contains('gr-diff'));
      assert.isTrue(node.classList.contains('test'));
      assert.isTrue(node.classList.contains('classes'));
    });

    test('formatText newlines 1', () => {
      let text = 'abcdef';

      assert.equal(formatText(text, 'NONE', 4, 10).innerHTML, text);
      text = 'a'.repeat(20);
      assert.equal(
        formatText(text, 'NONE', 4, 10).innerHTML,
        'a'.repeat(10) + LINE_BREAK_HTML + 'a'.repeat(10)
      );
    });

    test('formatText newlines 2', () => {
      const text = '<span class="thumbsup">👍</span>';
      assert.equal(
        formatText(text, 'NONE', 4, 10).innerHTML,
        '&lt;span clas' +
          LINE_BREAK_HTML +
          's="thumbsu' +
          LINE_BREAK_HTML +
          'p"&gt;👍&lt;/span' +
          LINE_BREAK_HTML +
          '&gt;'
      );
    });

    test('formatText newlines 3', () => {
      const text = '01234\t56789';
      assert.equal(
        formatText(text, 'NONE', 4, 10).innerHTML,
        '01234' + createTabWrapper(3).outerHTML + '56' + LINE_BREAK_HTML + '789'
      );
    });

    test('formatText newlines 4', () => {
      const text = '👍'.repeat(58);
      assert.equal(
        formatText(text, 'NONE', 4, 20).innerHTML,
        '👍'.repeat(20) +
          LINE_BREAK_HTML +
          '👍'.repeat(20) +
          LINE_BREAK_HTML +
          '👍'.repeat(18)
      );
    });

    test('tab wrapper style', () => {
      const pattern = new RegExp(
        '^<span class="style-scope gr-diff tab" ' +
          'style="((?:-moz-)?tab-size: (\\d+);.?)+">\\t<\\/span>$'
      );

      for (const size of [1, 3, 8, 55]) {
        const html = createTabWrapper(size).outerHTML;
        expect(html).to.match(pattern);
        assert.equal(html.match(pattern)?.[2], size.toString());
      }
    });

    test('tab wrapper insertion', () => {
      const html = 'abc\tdef';
      const tabSize = 8;
      const wrapper = createTabWrapper(tabSize - 3);
      assert.ok(wrapper);
      assert.equal(wrapper.innerText, '\t');
      assert.equal(
        formatText(html, 'NONE', tabSize, Infinity).innerHTML,
        'abc' + wrapper.outerHTML + 'def'
      );
    });

    test('escaping HTML', () => {
      let input = '<script>alert("XSS");<' + '/script>';
      let expected = '&lt;script&gt;alert("XSS");&lt;/script&gt;';

      let result = formatText(
        input,
        'NONE',
        1,
        Number.POSITIVE_INFINITY
      ).innerHTML;
      assert.equal(result, expected);

      input = '& < > " \' / `';
      expected = '&amp; &lt; &gt; " \' / `';
      result = formatText(input, 'NONE', 1, Number.POSITIVE_INFINITY).innerHTML;
      assert.equal(result, expected);
    });

    test('text length with tabs and unicode', () => {
      function expectTextLength(
        text: string,
        tabSize: number,
        expected: number
      ) {
        // Formatting to |expected| columns should not introduce line breaks.
        const result = formatText(text, 'NONE', tabSize, expected);
        assert.isNotOk(
          result.querySelector('.contentText > .br'),
          '  Expected the result of: \n' +
            `      _formatText(${text}', 'NONE',  ${tabSize}, ${expected})\n` +
            '  to not contain a br. But the actual result HTML was:\n' +
            `      '${result.innerHTML}'\nwhereupon`
        );

        // Increasing the line limit should produce the same markup.
        assert.equal(
          formatText(text, 'NONE', tabSize, Infinity).innerHTML,
          result.innerHTML
        );
        assert.equal(
          formatText(text, 'NONE', tabSize, expected + 1).innerHTML,
          result.innerHTML
        );

        // Decreasing the line limit should introduce line breaks.
        if (expected > 0) {
          const tooSmall = formatText(text, 'NONE', tabSize, expected - 1);
          assert.isOk(
            tooSmall.querySelector('.contentText > .br'),
            '  Expected the result of: \n' +
              `      _formatText(${text}', ${tabSize}, ${expected - 1})\n` +
              '  to contain a br. But the actual result HTML was:\n' +
              `      '${tooSmall.innerHTML}'\nwhereupon`
          );
        }
      }
      expectTextLength('12345', 4, 5);
      expectTextLength('\t\t12', 4, 10);
      expectTextLength('abc💢123', 4, 7);
      expectTextLength('abc\t', 8, 8);
      expectTextLength('abc\t\t', 10, 20);
      expectTextLength('', 10, 0);
      // 17 Thai combining chars.
      expectTextLength('ก้้้้้้้้้้้้้้้้', 4, 17);
      expectTextLength('abc\tde', 10, 12);
      expectTextLength('abc\tde\t', 10, 20);
      expectTextLength('\t\t\t\t\t', 20, 100);
    });
  });

  suite('lit rendering', () => {
    test('diffClasses', () => {
      const c = diffClasses('div', 'test classes').split(' ');
      assert.include(c, 'gr-diff');
      assert.include(c, 'style-scope');
      assert.include(c, 'test');
      assert.include(c, 'classes');
    });
  });
});
